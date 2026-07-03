/**
 * User-friendly API error parsing for the entire console.
 * Prefer parseApiError() in catch blocks; showApiError() when you also need a toast.
 */

import { toast } from "sonner";

const TECHNICAL_PATTERNS = [
  /^Request failed with status code \d+$/i,
  /^Network Error$/i,
  /^timeout of \d+ms exceeded$/i,
  /^ECONNABORTED$/i,
  /^AxiosError:/i,
  /^Illuminate\\/i,
  /^TypeError:/i,
  /^Error:/i,
  /^SQLSTATE\[/i,
  /^cURL error /i,
  /vendor\/laravel/i,
  /vendor\/fleetbase/i,
  /\.php on line \d+/i,
];

const STATUS_MESSAGES = {
  400: "We couldn't process that request. Please check your input and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "The requested item was not found.",
  409: "This action conflicts with existing data. Refresh the page and try again.",
  422: "Please fix the highlighted fields and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again.",
  502: "The server is temporarily unavailable. Please try again.",
  503: "The service is temporarily unavailable. Please try again.",
  504: "The server took too long to respond. Please try again.",
};

function humanizeFieldName(field) {
  return String(field || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function normalizeErrorEntry(entry) {
  if (entry == null) return "";
  if (typeof entry === "string") return friendlyDatabaseMessage(entry.trim());
  if (typeof entry === "number" || typeof entry === "boolean") return String(entry);
  if (typeof entry === "object") {
    if (typeof entry.message === "string") return friendlyDatabaseMessage(entry.message.trim());
    if (typeof entry.error === "string") return friendlyDatabaseMessage(entry.error.trim());
    if (typeof entry.detail === "string") return friendlyDatabaseMessage(entry.detail.trim());
  }
  return "";
}

/** Map common SQL constraint errors to user-facing copy. */
function friendlyDatabaseMessage(text) {
  if (!text) return text;

  const duplicateSku = text.match(
    /Duplicate entry '[^']+-([^']+)' for key '[^']*sku[^']*'/i,
  );
  if (duplicateSku) {
    return `A part with SKU "${duplicateSku[1]}" already exists. Check the parts list (including deleted rows) or use a different SKU.`;
  }

  if (/Duplicate entry/i.test(text) && /unique/i.test(text)) {
    return "This record conflicts with existing data (duplicate value). Check unique fields such as SKU or code.";
  }

  return text;
}

function isTechnicalMessage(text) {
  if (!text || typeof text !== "string") return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length > 240 && (trimmed.includes(" at ") || trimmed.includes("stacktrace"))) return true;
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function collectMessages(errors) {
  if (!errors) return [];
  if (Array.isArray(errors)) {
    return errors.map(normalizeErrorEntry).filter(Boolean);
  }
  if (typeof errors === "object") {
    const out = [];
    for (const [field, value] of Object.entries(errors)) {
      const items = Array.isArray(value) ? value : [value];
      for (const item of items) {
        const text = normalizeErrorEntry(item);
        if (!text) continue;
        if (field && field !== "0" && !/^\d+$/.test(field)) {
          out.push(`${humanizeFieldName(field)}: ${text}`);
        } else {
          out.push(text);
        }
      }
    }
    return out;
  }
  return [normalizeErrorEntry(errors)].filter(Boolean);
}

function collectFromPayload(data) {
  const messages = [];
  if (!data || typeof data !== "object") return messages;

  messages.push(...collectMessages(data.errors));

  if (Array.isArray(data.message)) {
    messages.push(...data.message.map(normalizeErrorEntry).filter(Boolean));
  } else if (typeof data.message === "string") {
    messages.push(data.message.trim());
  } else if (data.message && typeof data.message === "object") {
    messages.push(...collectMessages(data.message));
  }

  if (typeof data.error === "string") {
    messages.push(data.error.trim());
  }

  return messages;
}

function networkMessage(error) {
  if (error?.code === "ECONNABORTED" || /timeout/i.test(String(error?.message || ""))) {
    return "The request took too long. Please try again.";
  }
  if (!error?.response || error?.message === "Network Error") {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return null;
}

function statusMessage(status, fallback) {
  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (status >= 500) return STATUS_MESSAGES[500];
  return fallback;
}

/**
 * Turn any thrown API/network error into copy safe to show in the UI.
 */
export function parseApiError(error, fallback = "Something went wrong. Please try again.") {
  if (error == null) return fallback;

  if (typeof error === "string") {
    const text = error.trim();
    return isTechnicalMessage(text) ? fallback : text;
  }

  if (error?.code === "ONBOARDING_UNRECOVERABLE" && error?.message) {
    return error.message;
  }

  const data = error?.response?.data ?? error?.raw?.response?.data;
  const status = error?.response?.status ?? error?.status;
  const candidates = collectFromPayload(data).filter((msg) => !isTechnicalMessage(msg));

  if (candidates.length) {
    return [...new Set(candidates)].join("\n");
  }

  const preset = error?.friendlyMessage || error?.message;
  if (typeof preset === "string" && preset.trim() && !isTechnicalMessage(preset)) {
    return preset.trim();
  }

  const network = networkMessage(error);
  if (network) return network;

  return statusMessage(status, fallback);
}

/**
 * Laravel-style field errors keyed by input name.
 */
export function parseApiFieldErrors(error) {
  const errors = error?.response?.data?.errors;
  if (!errors || Array.isArray(errors) || typeof errors !== "object") return {};
  const out = {};
  for (const [field, value] of Object.entries(errors)) {
    const text = collectMessages({ [field]: value })[0];
    if (text) out[field] = text.replace(new RegExp(`^${humanizeFieldName(field)}:\\s*`, "i"), "");
  }
  return out;
}

/** @deprecated Use parseApiFieldErrors */
export const parseFleetopsFieldErrors = parseApiFieldErrors;

/** FleetOps alias — same parser site-wide. */
export function parseFleetopsApiError(error, fallback) {
  return parseApiError(error, fallback || "Request failed. Please try again.");
}

/**
 * Show a toast and return the parsed message (for inline form errors).
 */
export function showApiError(error, fallback = "Something went wrong. Please try again.") {
  const message = parseApiError(error, fallback);
  toast.error(message);
  return message;
}
