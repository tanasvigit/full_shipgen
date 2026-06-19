// CSV + PDF export utilities for YARD.OS
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { drawPdfBrandHeader, PDF_BRAND_HEADER_HEIGHT } from "./pdfBrandHeader";
import { BRAND_PRODUCT_NAME } from "../constants/brandPaths";

const escapeCsv = (val) => {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const timestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

/**
 * Export array of objects to CSV
 * @param {string} filename - base name (no extension)
 * @param {string[]} columns - column headers
 * @param {string[]} keys - row object keys matching columns
 * @param {object[]} rows - data rows
 */
export const exportCSV = (filename, columns, keys, rows) => {
  const header = columns.map(escapeCsv).join(",");
  const lines = rows.map((r) => keys.map((k) => escapeCsv(r[k])).join(","));
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}_${timestamp()}.csv`);
};

/**
 * Export tabular data to PDF
 * @param {object} opts
 *   title: string
 *   subtitle: string
 *   columns: string[]
 *   keys: string[]
 *   rows: object[]
 *   filename: string (no extension)
 *   meta: optional summary rows shown above table [{label, value}]
 */
export const exportPDF = async ({ title, subtitle, columns, keys, rows, filename, meta = [] }) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  await drawPdfBrandHeader(doc, pageWidth, {
    facilityLine: "Vehicle Orchestration Platform · Bhiwandi Mega Hub",
  });

  const titleY = PDF_BRAND_HEADER_HEIGHT + 32;

  // Title block
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 32, titleY);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 32, titleY + 16);
  }

  // Meta strip
  let cursorY = titleY + (subtitle ? 40 : 24);
  if (meta.length) {
    const blockW = (pageWidth - 64) / meta.length;
    meta.forEach((m, i) => {
      const x = 32 + i * blockW;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.rect(x, cursorY, blockW - 8, 44);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(String(m.label).toUpperCase(), x + 8, cursorY + 14);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(String(m.value), x + 8, cursorY + 32);
    });
    cursorY += 60;
  }

  // Table
  autoTable(doc, {
    startY: cursorY,
    head: [columns],
    body: rows.map((r) => keys.map((k) => (r[k] === undefined || r[k] === null ? "" : String(r[k])))),
    styles: { fontSize: 9, cellPadding: 6, textColor: [15, 23, 42] },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 32, right: 32 },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const footer = `Generated ${new Date().toLocaleString("en-IN")} · ${BRAND_PRODUCT_NAME} · Page ${i} of ${pageCount}`;
    doc.text(footer, 32, doc.internal.pageSize.getHeight() - 16);
  }

  doc.save(`${filename}_${timestamp()}.pdf`);
};
