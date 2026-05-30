/** Normalize Fleetbase validation / API errors for inline form display. */
export function parseFleetopsApiError(error) {
  const data = error?.response?.data;
  if (Array.isArray(data?.errors)) {
    return data.errors.map((e) => (typeof e === "string" ? e : e?.message || JSON.stringify(e))).join("\n");
  }
  if (Array.isArray(data?.message)) {
    return data.message.join("\n");
  }
  if (typeof data?.message === "string") {
    return data.message;
  }
  if (typeof data?.error === "string") {
    return data.error;
  }
  return error?.friendlyMessage || error?.message || "Request failed";
}
