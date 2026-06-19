import fs from "fs";
import path from "path";
import { VISUAL_PATHS } from "../playwright.visual-audit.config";

export interface UiFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  module: string;
  url: string;
  title: string;
  steps: string[];
  screenshot?: string;
  consoleSnippet?: string;
  networkSnippet?: string;
}

export interface VisualAuditResults {
  meta: {
    startedAt: string;
    finishedAt?: string;
    frontendUrl: string;
    apiUrl: string;
    headed: boolean;
    healthy: { frontend: boolean; backend: boolean };
  };
  modulesTested: string[];
  screensVisited: Array<{ path: string; name: string; url: string; screenshot?: string }>;
  buttonsTested: number;
  drawersTested: Array<{ id: string; route: string; ok: boolean; detail?: string }>;
  modalsTested: Array<{ id: string; route: string; ok: boolean }>;
  tablesInspected: Array<{ route: string; rowCount: number; empty: boolean }>;
  navItemsClicked: string[];
  yardMapActions: string[];
  consoleErrors: Array<{ route: string; type: string; text: string; location?: string }>;
  networkErrors: Array<{ route: string; method: string; status: number; url: string }>;
  uiFindings: UiFinding[];
  stabilityScore?: number;
}

let state: VisualAuditResults | null = null;

export function resetVisualAudit(frontendUrl: string, apiUrl: string): VisualAuditResults {
  fs.mkdirSync(VISUAL_PATHS.screenshots, { recursive: true });
  fs.mkdirSync(VISUAL_PATHS.videos, { recursive: true });
  state = {
    meta: {
      startedAt: new Date().toISOString(),
      frontendUrl,
      apiUrl,
      headed: true,
      healthy: { frontend: false, backend: false },
    },
    modulesTested: [],
    screensVisited: [],
    buttonsTested: 0,
    drawersTested: [],
    modalsTested: [],
    tablesInspected: [],
    navItemsClicked: [],
    yardMapActions: [],
    consoleErrors: [],
    networkErrors: [],
    uiFindings: [],
  };
  return state;
}

export function getVisualAudit(): VisualAuditResults {
  if (!state) throw new Error("Visual audit not initialized");
  return state;
}

export function saveVisualAudit(): void {
  if (!state) return;
  state.meta.finishedAt = new Date().toISOString();
  fs.writeFileSync(VISUAL_PATHS.resultsJson, JSON.stringify(state, null, 2), "utf8");
}

export function loadVisualAuditFromDisk(): VisualAuditResults | null {
  if (!fs.existsSync(VISUAL_PATHS.resultsJson)) return null;
  state = JSON.parse(fs.readFileSync(VISUAL_PATHS.resultsJson, "utf8"));
  return state;
}

export function addFinding(finding: UiFinding): void {
  const audit = getVisualAudit();
  audit.uiFindings.push(finding);
}

export function screenshotPath(slug: string): string {
  const safe = slug.replace(/[^a-z0-9_-]+/gi, "_").replace(/^_|_$/g, "").slice(0, 120);
  return path.join(VISUAL_PATHS.screenshots, `${safe}.png`);
}
