// Multi-page Daily Operations Report — live KPIs, detention, docks, recommendations.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY } from "../data/db";
import executiveKpisApi, { formatINR, toExportRows } from "../services/executiveKpisApi";
import detentionApi from "../services/detentionApi";
import controlTowerApi from "../services/controlTowerApi";
import ymsApi from "../services/ymsApi";
import { drawPdfBrandHeader } from "./pdfBrandHeader";
import { BRAND_PRODUCT_NAME } from "../constants/brandPaths";
import { exportCSV } from "./exporters";

const C = {
  slate900: [15, 23, 42],
  slate700: [51, 65, 85],
  slate500: [100, 116, 139],
  slate300: [203, 213, 225],
  slate200: [226, 232, 240],
  slate100: [241, 245, 249],
  slate50: [248, 250, 252],
  amber400: [251, 191, 36],
  emerald: [22, 163, 74],
  red: [220, 38, 38],
  amber: [217, 119, 6],
  blue: [37, 99, 235],
  white: [255, 255, 255],
};

const ts = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const drawBrandBar = async (doc, pageW) => {
  await drawPdfBrandHeader(doc, pageW, {
    facilityLine: `${COMPANY.facility}  ·  ${COMPANY.facilityCode}`,
  });
};

const drawFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...C.slate200);
    doc.setLineWidth(0.5);
    doc.line(32, pageH - 28, pageW - 32, pageH - 28);
    doc.setFontSize(8);
    doc.setTextColor(...C.slate500);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Daily Operations Report  ·  ${BRAND_PRODUCT_NAME}  ·  Generated ${new Date().toLocaleString("en-IN")}`,
      32,
      pageH - 16
    );
    doc.text(`Page ${i} of ${pageCount}`, pageW - 32, pageH - 16, { align: "right" });
  }
};

const sectionHeader = (doc, num, title, subtitle, y) => {
  doc.setFillColor(...C.slate900);
  doc.rect(32, y, 22, 22, "F");
  doc.setTextColor(...C.amber400);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(String(num), 38, y + 16);

  doc.setTextColor(...C.slate900);
  doc.setFontSize(16);
  doc.text(title, 64, y + 12);
  doc.setTextColor(...C.slate500);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 64, y + 24);
  return y + 40;
};

const metaTiles = (doc, tiles, y) => {
  const pageW = doc.internal.pageSize.getWidth();
  const tileW = (pageW - 64 - (tiles.length - 1) * 8) / tiles.length;
  tiles.forEach((t, i) => {
    const x = 32 + i * (tileW + 8);
    doc.setDrawColor(...C.slate200);
    doc.setLineWidth(0.5);
    doc.setFillColor(...C.slate50);
    doc.rect(x, y, tileW, 56, "FD");
    doc.setFontSize(8);
    doc.setTextColor(...C.slate500);
    doc.setFont("helvetica", "bold");
    doc.text(String(t.label).toUpperCase(), x + 10, y + 16);
    doc.setFontSize(18);
    doc.setTextColor(...(t.color || C.slate900));
    doc.text(String(t.value), x + 10, y + 38);
    if (t.hint) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.slate500);
      doc.text(t.hint, x + 10, y + 50);
    }
  });
  return y + 72;
};

const verdictPill = (doc, x, y, label, state) => {
  const map = {
    success: { fill: [220, 252, 231], text: C.emerald, label: "ON TRACK" },
    warning: { fill: [254, 243, 199], text: C.amber, label: "WATCH" },
    danger: { fill: [254, 226, 226], text: C.red, label: "CRITICAL" },
    info: { fill: [219, 234, 254], text: C.blue, label: "STEADY" },
  };
  const m = map[state] || map.info;
  doc.setFillColor(...m.fill);
  doc.rect(x, y - 10, 70, 14, "F");
  doc.setTextColor(...m.text);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(m.label, x + 35, y, { align: "center" });
  doc.setTextColor(...C.slate900);
  doc.setFont("helvetica", "normal");
  doc.text(label, x + 80, y);
};

const buildVerdicts = (scorecard, headline) => {
  const fromScorecard = scorecard.slice(0, 5).map((k) => ({
    label: `${k.metric}: ${k.value} (target ${k.target})`,
    state: k.status,
  }));
  if (fromScorecard.length > 0) return fromScorecard;
  return [
    {
      label: `Exited today: ${headline?.exitedToday ?? 0} vehicles · In yard: ${headline?.inYard ?? 0}`,
      state: "info",
    },
  ];
};

export async function fetchDailyReportData() {
  const bundle = await executiveKpisApi.fetchExecutiveKpisBundle();
  const headline = bundle.headline ?? {};
  const scorecard = bundle.scorecard ?? [];

  let detentionRecords = [];
  let detentionSummary = { today: headline.detentionToday ?? 0 };
  try {
    const det = await detentionApi.fetchDetentionBundle();
    detentionRecords = det.records;
    detentionSummary = det.summary ?? detentionSummary;
  } catch (e) {
    console.warn("[dailyReport] detention fetch failed", e);
  }

  let docks = [];
  try {
    docks = await ymsApi.listDocks();
  } catch (e) {
    console.warn("[dailyReport] docks fetch failed", e);
  }

  let recommendations = [];
  try {
    const tower = await controlTowerApi.fetchControlTowerDashboard();
    recommendations = tower.recommendations ?? [];
  } catch (e) {
    console.warn("[dailyReport] recommendations fetch failed", e);
  }

  const totalDetention = detentionRecords.reduce((s, r) => s + r.cost, 0);
  const totalSavings = recommendations.reduce((s, a) => s + (a.savings || 0), 0);
  const dockOccupied = docks.filter((d) => d.status === "OCCUPIED" || d.status === "DELAYED").length;
  const dockUtilPct = docks.length
    ? Math.round((docks.filter((d) => d.status === "OCCUPIED").length / docks.length) * 100)
    : headline.dockUtilizationPct ?? 0;

  return {
    headline,
    scorecard,
    detentionRecords,
    detentionSummary,
    docks,
    recommendations,
    totalDetention,
    totalSavings,
    dockOccupied,
    dockUtilPct,
  };
}

export const exportDailyOperationsReportCSV = async () => {
  const { scorecard } = await fetchDailyReportData();
  const rows = toExportRows(scorecard);
  exportCSV(
    `YARDOS_Daily_Operations_Report_${ts()}`,
    ["Metric", "Current", "Target", "Δ vs Yesterday", "State"],
    ["metric", "current", "target", "delta", "state"],
    rows
  );
};

export const exportDailyOperationsReport = async () => {
  const {
    headline,
    scorecard,
    detentionRecords,
    detentionSummary,
    docks,
    recommendations,
    totalDetention,
    totalSavings,
    dockOccupied,
    dockUtilPct,
  } = await fetchDailyReportData();

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  await drawBrandBar(doc, pageW);

  doc.setTextColor(...C.slate900);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text("Daily Operations Report", 32, 110);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.slate500);
  const dateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`${dateStr}  ·  ${COMPANY.shift}  ·  Controller: ${COMPANY.operator}`, 32, 132);

  metaTiles(
    doc,
    [
      { label: "Vehicles in Yard", value: String(headline.inYard ?? 0), hint: "active now" },
      {
        label: "Avg TAT",
        value: `${headline.avgTurnaroundMin ?? 0} min`,
        hint: "target 90 min",
        color: C.amber,
      },
      {
        label: "Dock Utilization",
        value: `${dockUtilPct}%`,
        hint: `${dockOccupied}/${docks.length || "—"} active`,
        color: C.emerald,
      },
      {
        label: "Yard Occupancy",
        value: `${headline.yardOccupancyPct ?? 0}%`,
        hint: "target 75%",
        color: C.emerald,
      },
      {
        label: "Detention Today",
        value: formatINR(detentionSummary.today ?? headline.detentionToday ?? 0),
        hint: `${detentionRecords.length} records`,
        color: C.red,
      },
      {
        label: "AI Savings",
        value: formatINR(totalSavings),
        hint: `${recommendations.length} insights`,
        color: C.emerald,
      },
    ],
    160
  );

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.slate900);
  doc.text("Day Verdict", 32, 270);
  doc.setDrawColor(...C.slate200);
  doc.line(32, 278, pageW - 32, 278);

  buildVerdicts(scorecard, headline).forEach((v, i) => {
    verdictPill(doc, 32, 300 + i * 22, v.label, v.state);
  });

  doc.addPage();
  await drawBrandBar(doc, pageW);
  let y = sectionHeader(
    doc,
    1,
    "KPI Scorecard",
    "Operations · Financial · AI · Quality — live daily targets vs actuals",
    80
  );

  const kpiBody = toExportRows(scorecard).map((k) => [k.metric, k.current, k.target, k.delta, k.state]);

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Current", "Target", "Δ vs Yesterday", "State"]],
    body: kpiBody,
    styles: { fontSize: 10, cellPadding: 8, textColor: C.slate900 },
    headStyles: { fillColor: C.slate900, textColor: C.white, fontStyle: "bold" },
    alternateRowStyles: { fillColor: C.slate50 },
    columnStyles: {
      1: { halign: "right", fontStyle: "bold" },
      2: { halign: "right", textColor: C.slate500 },
      3: { halign: "right", fontStyle: "bold" },
      4: { halign: "center", fontStyle: "bold", fontSize: 9 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const t = String(data.cell.raw);
        if (t === "CRITICAL") data.cell.styles.textColor = C.red;
        else if (t === "WATCH") data.cell.styles.textColor = C.amber;
        else if (t === "ON TRACK") data.cell.styles.textColor = C.emerald;
        else data.cell.styles.textColor = C.blue;
      }
    },
    margin: { left: 32, right: 32 },
  });

  doc.addPage();
  await drawBrandBar(doc, pageW);
  y = sectionHeader(
    doc,
    2,
    "Detention Records",
    `${detentionRecords.length} records · Total ${formatINR(totalDetention)}`,
    80
  );

  y = metaTiles(
    doc,
    [
      { label: "Today", value: formatINR(detentionSummary.today ?? 0), color: C.red },
      {
        label: "Disputed",
        value: String(detentionRecords.filter((r) => r.status === "Disputed").length),
        color: C.amber,
      },
      {
        label: "Approved",
        value: String(detentionRecords.filter((r) => r.status === "Approved").length),
        color: C.emerald,
      },
      {
        label: "Outside Vehicles",
        value: String(detentionRecords.filter((r) => r.category === "Outside").length),
        color: C.slate900,
      },
    ],
    y
  );

  autoTable(doc, {
    startY: y,
    head: [["Ticket", "Plate", "Category", "Transporter", "Free", "Actual", "Rate", "Cost", "Status"]],
    body: detentionRecords.map((r) => [
      r.id,
      r.plate,
      r.category,
      r.transporter,
      `${r.freeHours}h`,
      `${r.actualHours}h`,
      formatINR(r.rate),
      formatINR(r.cost),
      r.status,
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: C.slate900 },
    headStyles: { fillColor: C.slate900, textColor: C.white, fontStyle: "bold" },
    alternateRowStyles: { fillColor: C.slate50 },
    columnStyles: {
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 7) data.cell.styles.textColor = C.red;
      if (data.section === "body" && data.column.index === 8) {
        const t = String(data.cell.raw);
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = t === "Disputed" ? C.red : C.emerald;
      }
    },
    margin: { left: 32, right: 32 },
  });

  doc.addPage();
  await drawBrandBar(doc, pageW);
  y = sectionHeader(
    doc,
    3,
    "Dock Utilization",
    `${docks.length} docks · live status from YMS`,
    80
  );

  const dockAvail = docks.filter((d) => d.status === "AVAILABLE").length;
  const dockOcc = docks.filter((d) => d.status === "OCCUPIED").length;
  const dockDelayed = docks.filter((d) => d.status === "DELAYED").length;
  const dockMaint = docks.filter((d) => d.status === "MAINTENANCE").length;
  y = metaTiles(
    doc,
    [
      { label: "Available", value: String(dockAvail), color: C.emerald },
      { label: "Occupied", value: String(dockOcc), color: C.red },
      { label: "Delayed", value: String(dockDelayed), color: C.amber },
      { label: "Maintenance", value: String(dockMaint), color: C.slate500 },
      { label: "Utilization", value: `${dockUtilPct}%`, color: C.blue },
    ],
    y
  );

  autoTable(doc, {
    startY: y,
    head: [["Dock", "Type", "Status", "Vehicle", "Equipment", "Labor"]],
    body: docks.map((d) => [
      d.dock_code || d.id,
      d.dock_type || d.dock_name || "—",
      d.status,
      d.current_vehicle_id ? "Assigned" : "—",
      "—",
      "—",
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: C.slate900 },
    headStyles: { fillColor: C.slate900, textColor: C.white, fontStyle: "bold" },
    alternateRowStyles: { fillColor: C.slate50 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const s = String(data.cell.raw);
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor =
          s === "AVAILABLE" ? C.emerald : s === "OCCUPIED" ? C.red : s === "DELAYED" ? C.amber : C.slate500;
      }
    },
    margin: { left: 32, right: 32 },
  });

  doc.addPage();
  await drawBrandBar(doc, pageW);
  y = sectionHeader(
    doc,
    4,
    "AI Recommendations",
    "Rule-based insights from Control Tower",
    80
  );

  doc.setFillColor(...C.slate900);
  doc.rect(32, y, pageW - 64, 54, "F");
  doc.setTextColor(...C.amber400);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL POTENTIAL SAVINGS — IF ALL APPLIED TODAY", 48, y + 20);
  doc.setTextColor(...C.white);
  doc.setFontSize(26);
  doc.text(formatINR(totalSavings), 48, y + 44);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.slate300);
  doc.text(`Across ${recommendations.length} active insights`, pageW - 48, y + 36, { align: "right" });

  y += 72;

  autoTable(doc, {
    startY: y,
    head: [["Module", "Recommendation", "Impact", "Savings", "Confidence", "Severity"]],
    body: recommendations.map((a) => [
      a.module,
      a.title,
      a.impact,
      a.savings > 0 ? formatINR(a.savings) : "—",
      `${a.confidence}%`,
      (a.severity || "info").toUpperCase(),
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: C.slate900, valign: "top" },
    headStyles: { fillColor: C.slate900, textColor: C.white, fontStyle: "bold" },
    alternateRowStyles: { fillColor: C.slate50 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 90 },
      1: { cellWidth: 220 },
      3: { halign: "right", fontStyle: "bold", textColor: C.emerald },
      4: { halign: "center" },
      5: { halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const s = String(data.cell.raw).toLowerCase();
        data.cell.styles.textColor =
          s === "danger" ? C.red : s === "warning" ? C.amber : s === "success" ? C.emerald : C.blue;
      }
    },
    margin: { left: 32, right: 32 },
  });

  const finalY = doc.lastAutoTable.finalY || y + 100;
  if (finalY < pageH - 80) {
    doc.setDrawColor(...C.slate300);
    doc.line(32, finalY + 30, 200, finalY + 30);
    doc.setFontSize(9);
    doc.setTextColor(...C.slate500);
    doc.text("Yard Controller — Signature", 32, finalY + 44);
    doc.line(pageW - 200, finalY + 30, pageW - 32, finalY + 30);
    doc.text("Operations Manager — Signature", pageW - 200, finalY + 44);
  }

  drawFooter(doc);
  doc.save(`YARDOS_Daily_Operations_Report_${ts()}.pdf`);
};
