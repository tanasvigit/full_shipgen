import type { TestInfo } from "@playwright/test";

export type ScenarioFinding = {
  category:
    | "UX"
    | "stale-state"
    | "race"
    | "loader"
    | "workflow"
    | "mobile"
    | "performance"
    | "backend";
  message: string;
};

const findings: ScenarioFinding[] = [];

export function recordScenarioFinding(finding: ScenarioFinding) {
  findings.push(finding);
}

export function flushScenarioFindings(testInfo: TestInfo) {
  if (findings.length === 0) return;
  testInfo.annotations.push({
    type: "operational-findings",
    description: JSON.stringify(findings, null, 2),
  });
  findings.length = 0;
}

export function attachScenarioSummary(
  testInfo: TestInfo,
  summary: Record<string, unknown>,
) {
  testInfo.annotations.push({
    type: "scenario-summary",
    description: JSON.stringify(summary, null, 2),
  });
}
