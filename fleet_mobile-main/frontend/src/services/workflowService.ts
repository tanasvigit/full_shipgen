import { apiRequest } from "@/src/lib/api";
import { captureError, logWorkflow } from "@/src/services/observability";
import {
  activityCode,
  mapNextActivityPreview,
  normalizeActivityList,
  pickAdvanceActivity,
  pickCompletionActivity,
  pickFirstActivity,
} from "@/src/services/workflowSelectors";

export {
  activityCode,
  mapNextActivityPreview,
  normalizeActivityList,
  pickAdvanceActivity,
  pickCompletionActivity,
  pickFirstActivity,
} from "@/src/services/workflowSelectors";

export const workflowService = {
  async getNextActivities(orderId: string) {
    const payload = await apiRequest(`/orders/next-activity/${orderId}`, { method: "GET" });
    return normalizeActivityList(payload);
  },

  async applyActivity(orderId: string, activity: import("@/src/types/api/orders").WorkflowActivityDTO) {
    await apiRequest(`/orders/update-activity/${orderId}`, {
      method: "PATCH",
      body: { activity },
    });
  },

  async getNextActivity(orderId: string) {
    const activities = await this.getNextActivities(orderId);
    return mapNextActivityPreview(pickFirstActivity(activities));
  },

  async start(orderId: string) {
    logWorkflow("start", { orderId });
    const activities = await this.getNextActivities(orderId);
    const first = pickFirstActivity(activities);
    if (!first) throw new Error("No next activity available to start this trip.");
    try {
      await this.applyActivity(orderId, first);
      logWorkflow("start.applied", { orderId, code: activityCode(first) });
    } catch (error) {
      captureError(error, { operation: "workflow.start", orderId });
      throw error;
    }
  },

  async advance(orderId: string, nextCode?: string) {
    logWorkflow("advance", { orderId, nextCode });
    const activities = await this.getNextActivities(orderId);
    const match = pickAdvanceActivity(activities, nextCode);
    if (!match) throw new Error("No activity to advance.");
    try {
      await this.applyActivity(orderId, match);
      logWorkflow("advance.applied", { orderId, code: activityCode(match) });
    } catch (error) {
      captureError(error, { operation: "workflow.advance", orderId, nextCode });
      throw error;
    }
  },

  async complete(orderId: string) {
    logWorkflow("complete", { orderId });
    const activities = await this.getNextActivities(orderId);
    const completion = pickCompletionActivity(activities);
    if (!completion) throw new Error("No completion activity available.");
    try {
      await this.applyActivity(orderId, completion);
      logWorkflow("complete.applied", { orderId, code: activityCode(completion) });
    } catch (error) {
      captureError(error, { operation: "workflow.complete", orderId });
      throw error;
    }
  },
};
