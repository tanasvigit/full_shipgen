/**
 * Gate hardware abstraction — mock implementations for QR / ANPR / gate pass.
 * Replace provider functions when integrating real devices.
 */

/** @typedef {{ query: string; scanType: 'QR' | 'ANPR' | 'GATE_PASS'; raw?: string }} ScanResult */

let _qrProvider = null;
let _anprProvider = null;
let _gatePassProvider = null;

/**
 * Register a QR scanner provider.
 * @param {() => Promise<ScanResult>} fn
 */
export function setQRScannerProvider(fn) {
  _qrProvider = fn;
}

/**
 * Register an ANPR / license plate reader provider.
 * @param {() => Promise<ScanResult>} fn
 */
export function setANPRScannerProvider(fn) {
  _anprProvider = fn;
}

/**
 * Register a gate pass verifier (RFID / barcode).
 * @param {(code: string) => Promise<{ valid: boolean; vehicleRef?: string }>} fn
 */
export function setGatePassVerifier(fn) {
  _gatePassProvider = fn;
}

/** Default mock — resolves after delay with fallback query. */
async function mockScan(scanType, fallbackQuery = "") {
  await new Promise((r) => setTimeout(r, 800));
  const query = (fallbackQuery || "").trim();
  if (!query) throw new Error("No scan target — enter plate or booking ref first");
  return { query, scanType, raw: `MOCK-${scanType}-${query}` };
}

/**
 * Scan QR code at gate.
 * @param {string} [fallbackQuery] - Manual fallback when no hardware
 * @returns {Promise<ScanResult>}
 */
export async function scanQR(fallbackQuery = "") {
  if (_qrProvider) return _qrProvider();
  return mockScan("QR", fallbackQuery);
}

/**
 * Scan ANPR / license plate.
 * @param {string} [fallbackQuery]
 * @returns {Promise<ScanResult>}
 */
export async function scanANPR(fallbackQuery = "") {
  if (_anprProvider) return _anprProvider();
  return mockScan("ANPR", fallbackQuery);
}

/**
 * Verify gate pass document.
 * @param {string} code
 * @returns {Promise<{ valid: boolean; vehicleRef?: string; message?: string }>}
 */
export async function verifyGatePass(code) {
  if (_gatePassProvider) return _gatePassProvider(code);
  await new Promise((r) => setTimeout(r, 400));
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return { valid: false, message: "Empty gate pass code" };
  return { valid: true, vehicleRef: normalized, message: "Mock gate pass accepted" };
}

export default { scanQR, scanANPR, verifyGatePass, setQRScannerProvider, setANPRScannerProvider, setGatePassVerifier };
