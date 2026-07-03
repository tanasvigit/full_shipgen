/** Parse orchestrator import CSV/TSV into row objects for POST /orchestrator/import-orders. */

function parseDelimitedLine(line, delimiter = ",") {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
}

function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function parseOrderIdsText(text = "") {
  return String(text)
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseCsvToOrchestratorRows(text = "") {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = parseDelimitedLine(lines[0], delimiter).map(normalizeHeader);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseDelimitedLine(lines[i], delimiter);
    if (!values.some((value) => value !== "")) continue;

    const row = { _rowIndex: i + 1 };
    headers.forEach((header, index) => {
      if (!header) return;
      row[header] = values[index] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

export function orchestratorOrderEligibility(order) {
  if (!order) return "Order not found.";

  const status = String(order.status || "").toLowerCase();
  const allowed = ["created", "dispatched", "started", "en_route", "enroute"];
  if (!allowed.includes(status)) {
    return "Order status is not eligible for orchestrator.";
  }

  const payload = order.payload || {};
  const hasPlace =
    payload.pickup ||
    payload.dropoff ||
    (Array.isArray(payload.waypoints) && payload.waypoints.length > 0);
  if (!hasPlace) {
    return "Payload needs pickup, dropoff, or waypoint places.";
  }

  if (!order.tracking_number && !order.trackingNumber) {
    return "Order is missing a tracking number.";
  }

  const trackingStatuses = order.tracking_statuses || order.trackingStatuses || [];
  if (!Array.isArray(trackingStatuses) || trackingStatuses.length === 0) {
    return "Order is missing tracking statuses.";
  }

  return null;
}

export function summarizeOrchestratorPoolValidation(results = []) {
  const acknowledged = results.filter((entry) => entry.ok);
  const ineligible = results.filter((entry) => !entry.ok && entry.reason !== "Order not found.");
  const notFound = results.filter((entry) => !entry.ok && entry.reason === "Order not found.");

  if (acknowledged.length) {
    const parts = [`${acknowledged.length} order(s) ready in orchestrator pool.`];
    if (ineligible.length) {
      parts.push(`${ineligible.length} order(s) need fixes before they appear in the pool.`);
    }
    if (notFound.length) {
      parts.push(`${notFound.length} order ID(s) were not found.`);
    }
    return {
      tone: ineligible.length || notFound.length ? "warning" : "success",
      message: parts.join(" "),
    };
  }

  if (notFound.length) {
    return { tone: "error", message: `Order not found: ${notFound.map((entry) => entry.id).join(", ")}` };
  }

  if (ineligible.length) {
    const first = ineligible[0];
    return {
      tone: "error",
      message: `${first.id}: ${first.reason || "Not eligible for orchestrator pool."}`,
    };
  }

  return null;
}

export function summarizeOrchestratorImportResult(result = {}) {
  const poolSummary = summarizeOrchestratorPoolValidation(
    (result.acknowledged || []).map((id) => ({ id, ok: true })).concat(
      (result.ineligible || []).map((entry) => ({
        id: entry.order_id,
        ok: false,
        reason: entry.reason,
      })),
      (result.not_found || []).map((id) => ({ id, ok: false, reason: "Order not found." })),
    ),
  );
  if (poolSummary) return poolSummary;

  const created = Array.isArray(result.created) ? result.created : [];
  const failed = Array.isArray(result.failed) ? result.failed : [];

  if (created.length) {
    return {
      tone: "success",
      message: `Created ${created.length} order(s) for orchestrator.`,
    };
  }

  if (failed.length) {
    return {
      tone: "error",
      message: failed[0]?.error || "Import failed for one or more rows.",
    };
  }

  return { tone: "success", message: "Import completed." };
}
