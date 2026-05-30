/** Document taxonomy for FleetOps attachments. */

export const DOCUMENT_CATEGORIES = {
  compliance: { label: "Compliance", types: ["license", "insurance", "inspection"] },
  pod: { label: "Proof of delivery", types: ["pod", "signature", "photo"] },
  manifest: { label: "Manifest", types: ["manifest", "bill_of_lading"] },
  invoice: { label: "Billing", types: ["invoice", "receipt"] },
  general: { label: "General", types: [] },
};

export function categorizeFile(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  const tag = String(file?.category || file?.meta?.category || "").toLowerCase();

  if (tag.includes("pod") || tag.includes("proof")) return "pod";
  if (tag.includes("license")) return "compliance";
  if (tag.includes("insurance")) return "compliance";
  if (tag.includes("manifest") || name.includes("manifest")) return "manifest";
  if (tag.includes("invoice") || name.includes("invoice")) return "invoice";
  if (type.includes("pdf") && (name.includes("pod") || name.includes("proof"))) return "pod";
  return "general";
}

export function groupFilesByCategory(files) {
  const groups = Object.fromEntries(Object.keys(DOCUMENT_CATEGORIES).map((k) => [k, []]));
  for (const file of files) {
    const cat = categorizeFile(file);
    groups[cat] = groups[cat] || [];
    groups[cat].push(file);
  }
  return groups;
}
