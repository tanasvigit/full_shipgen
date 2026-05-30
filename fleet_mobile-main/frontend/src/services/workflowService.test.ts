import { describe, expect, it } from "vitest";
import {
  activityCode,
  pickAdvanceActivity,
  pickCompletionActivity,
  pickFirstActivity,
} from "@/src/services/workflowSelectors";
import type { WorkflowActivityDTO } from "@/src/types/api/orders";

const activities: WorkflowActivityDTO[] = [
  { code: "start", status: "Start trip" },
  { code: "arrived", status: "Arrived" },
  { code: "complete", status: "Complete", complete: true },
];

describe("workflowService selection", () => {
  it("picks first activity for start flow", () => {
    expect(activityCode(pickFirstActivity(activities)!)).toBe("start");
  });

  it("picks matching advance activity by code", () => {
    expect(activityCode(pickAdvanceActivity(activities, "arrived")!)).toBe("arrived");
  });

  it("falls back to first activity when code is missing", () => {
    expect(activityCode(pickAdvanceActivity(activities)!)).toBe("start");
  });

  it("prefers completion-flagged activity", () => {
    expect(activityCode(pickCompletionActivity(activities)!)).toBe("complete");
  });
});
