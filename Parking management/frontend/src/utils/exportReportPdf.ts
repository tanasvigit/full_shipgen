import type { ReportsDashboardData } from '../types/reports';

export type ReportPdfPayload = {
  title: string;
  rangeLabel: string;
  generatedAt: Date;
  data: ReportsDashboardData;
};

type PdfDocument = InstanceType<typeof import('jspdf').jsPDF>;

async function loadJsPdf() {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch('/security-systems-1.svg');
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    return await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || 120;
        canvas.height = image.naturalHeight || 40;
        const context = canvas.getContext('2d');
        if (!context) {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
          return;
        }
        context.drawImage(image, 0, 0);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      image.src = objectUrl;
    });
  } catch {
    return null;
  }
}

function addSectionTitle(doc: PdfDocument, title: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(38, 36, 39);
  doc.text(title, 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  return y + 8;
}

export async function exportReportPdf(payload: ReportPdfPayload): Promise<void> {
  const jsPDF = await loadJsPdf();
  const { title, rangeLabel, generatedAt, data } = payload;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const logo = await loadLogoDataUrl();
  let y = 16;

  if (logo) {
    doc.addImage(logo, 'PNG', 14, y, 42, 14);
    y += 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(234, 28, 38);
  doc.text('Security Systems', 14, y);
  y += 8;

  doc.setFontSize(14);
  doc.setTextColor(38, 36, 39);
  doc.text(title, 14, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Period: ${rangeLabel}`, 14, y);
  y += 5;
  doc.text(`Vehicle type: ${data.vehicleTypeLabel}`, 14, y);
  y += 5;
  doc.text(`Generated: ${generatedAt.toLocaleString()}`, 14, y);
  y += 10;

  y = addSectionTitle(doc, 'Summary', y);
  const summaryRows = [
    ['Total entries', data.totalEntries.toLocaleString()],
    ['Total exits', data.totalExits.toLocaleString()],
    ['Vehicles inside (current)', data.vehiclesInside.toLocaleString()],
    ['Total revenue', `₹${data.totalRevenue.toLocaleString()}`],
    ['Occupancy', `${data.occupancyPercent}%`],
    [
      'Avg revenue / day',
      data.rangeDayCount > 0
        ? `₹${Math.round(data.totalRevenue / data.rangeDayCount).toLocaleString()}`
        : '₹0',
    ],
  ];
  summaryRows.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 14, y);
    y += 5;
  });
  y += 6;

  y = addSectionTitle(doc, 'Revenue by day', y);
  if (data.revenuePoints.length === 0) {
    doc.text('No revenue recorded for this period.', 14, y);
    y += 8;
  } else {
    data.revenuePoints.forEach((point) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${point.day}: ₹${point.revenue.toLocaleString()}`, 14, y);
      y += 5;
    });
    y += 4;
  }

  y = addSectionTitle(doc, 'Category distribution', y);
  if (data.categoryData.length === 0) {
    doc.text('No category data for this period.', 14, y);
  } else {
    data.categoryData.forEach((slice) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${slice.name}: ${slice.value.toLocaleString()}`, 14, y);
      y += 5;
    });
  }

  const safeRange = rangeLabel.replace(/[^\w-]+/g, '_').slice(0, 40);
  doc.save(`security-systems-report-${safeRange}.pdf`);
}
