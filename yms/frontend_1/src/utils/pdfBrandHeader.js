import {
  BRAND_LOGO_FULL,
  BRAND_LOGO_FULL_ASPECT,
  BRAND_PRODUCT_NAME,
  BRAND_PRODUCT_TAGLINE,
} from "../constants/brandPaths";

const HEADER_HEIGHT = 56;
const LOGO_HEIGHT = 28;
const LOGO_X = 32;
const LOGO_Y = 14;

let cachedLogoDataUrl = null;
let cachedLogoDims = null;

export const PDF_BRAND_HEADER_HEIGHT = HEADER_HEIGHT;

function loadBrandLogo() {
  if (cachedLogoDataUrl) {
    return Promise.resolve({ dataUrl: cachedLogoDataUrl, dims: cachedLogoDims });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      cachedLogoDataUrl = canvas.toDataURL("image/png");
      cachedLogoDims = { w: img.naturalWidth, h: img.naturalHeight };
      resolve({ dataUrl: cachedLogoDataUrl, dims: cachedLogoDims });
    };
    img.onerror = () => reject(new Error("Failed to load brand logo for PDF"));
    img.src = BRAND_LOGO_FULL;
  });
}

/**
 * Draw enterprise brand header on a jsPDF page (header bar only — not in tables).
 * @param {import('jspdf').jsPDF} doc
 * @param {number} pageWidth
 * @param {{ facilityLine?: string }} [opts]
 */
export async function drawPdfBrandHeader(doc, pageWidth, opts = {}) {
  const { facilityLine } = opts;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, "F");

  const textX = LOGO_X;

  try {
    const { dataUrl } = await loadBrandLogo();
    const logoW = LOGO_HEIGHT * BRAND_LOGO_FULL_ASPECT;
    doc.addImage(dataUrl, "PNG", LOGO_X, LOGO_Y, logoW, LOGO_HEIGHT);
    const facilityX = LOGO_X + logoW + 14;

    doc.setTextColor(251, 191, 36);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(BRAND_PRODUCT_NAME, facilityX, 24);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(BRAND_PRODUCT_TAGLINE, facilityX, 36);

    if (facilityLine) {
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(facilityLine, facilityX, 46);
    }
  } catch {
    doc.setTextColor(251, 191, 36);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(BRAND_PRODUCT_NAME, textX, 28);
    doc.setTextColor(203, 213, 225);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(BRAND_PRODUCT_TAGLINE, textX, 42);
    if (facilityLine) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(facilityLine, textX, 52);
    }
  }

  return HEADER_HEIGHT;
}
