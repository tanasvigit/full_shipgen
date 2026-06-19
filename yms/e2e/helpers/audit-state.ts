import fs from "fs";
import path from "path";
import { PATHS } from "../playwright.config";

export type ButtonResult = "PASS" | "FAILED" | "NO_ACTION" | "ERROR" | "SKIPPED_DISABLED" | "SKIPPED_POLICY";

export interface AuditResults {
  meta: {
    startedAt: string;
    finishedAt?: string;
    frontendUrl: string;
    apiUrl: string;
    healthy: { frontend: boolean; backend: boolean };
  };
  routes: Array<{
    path: string;
    name: string;
    status: "PASS" | "FAIL" | "WARN";
    issues: string[];
    screenshot?: string;
    alias?: boolean;
  }>;
  buttons: Array<{
    route: string;
    label: string;
    testId: string | null;
    result: ButtonResult;
    detail?: string;
  }>;
  drawers: Array<{
    drawer: string;
    route: string;
    opens: boolean;
    closes: boolean;
    dataLoaded: boolean;
    consoleErrors: number;
    detail?: string;
  }>;
  forms: Array<{
    id: string;
    route: string;
    status: "PASS" | "FAIL" | "SKIP";
    detail?: string;
  }>;
  apiFailures: Array<{
    url: string;
    method: string;
    status: number;
    route: string;
  }>;
  consoleErrors: Array<{
    route: string;
    type: string;
    text: string;
    location?: string;
  }>;
  runtimeExceptions: Array<{
    route: string;
    message: string;
    stack?: string;
  }>;
  search: Array<{
    term: string;
    status: "PASS" | "FAIL";
    hasResults: boolean;
    detail?: string;
  }>;
  rbac: Array<{
    id: string;
    role: string;
    status: "PASS" | "FAIL" | "SKIP";
    detail?: string;
  }>;
}

export function createEmptyAudit(frontendUrl: string, apiUrl: string): AuditResults {
  return {
    meta: {
      startedAt: new Date().toISOString(),
      frontendUrl,
      apiUrl,
      healthy: { frontend: false, backend: false },
    },
    routes: [],
    buttons: [],
    drawers: [],
    forms: [],
    apiFailures: [],
    consoleErrors: [],
    runtimeExceptions: [],
    search: [],
    rbac: [],
  };
}

let state: AuditResults | null = null;

export function getAuditState(): AuditResults {
  if (!state) {
    const existing = loadFromDisk();
    state =
      existing ??
      createEmptyAudit(
        process.env.YMS_FRONTEND_URL || "http://localhost:3001",
        process.env.YMS_API_URL || "http://localhost:8001"
      );
  }
  return state;
}

/** Reload persisted results between serial test phases. */
export function hydrateAuditFromDisk(): AuditResults | null {
  const existing = loadFromDisk();
  if (existing) state = existing;
  return existing;
}

export function resetAuditState(frontendUrl: string, apiUrl: string): AuditResults {
  state = createEmptyAudit(frontendUrl, apiUrl);
  return state;
}

export function saveAuditState(): void {
  const s = getAuditState();
  s.meta.finishedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(PATHS.resultsJson), { recursive: true });
  fs.writeFileSync(PATHS.resultsJson, JSON.stringify(s, null, 2), "utf8");
}

export function loadFromDisk(): AuditResults | null {
  try {
    if (fs.existsSync(PATHS.resultsJson)) {
      return JSON.parse(fs.readFileSync(PATHS.resultsJson, "utf8")) as AuditResults;
    }
  } catch {
    /* ignore */
  }
  return null;
}
