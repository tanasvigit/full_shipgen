import { workflowService } from "@/src/services/workflowService";

type NextActivity = { code?: string; name?: string };

/**
 * Internal API uses server-driven workflow metadata.
 * Keep this wrapper for backwards compatibility with existing screens.
 */
export async function getNextActivity(orderId: string): Promise<NextActivity | null> {
  const next = await workflowService.getNextActivity(orderId);
  if (!next) return null;
  return { code: next.code, name: next.name };
}

export async function startTrip(orderId: string) {
  await workflowService.start(orderId);
}

export async function advanceActivity(orderId: string, activityCode: string) {
  await workflowService.advance(orderId, activityCode);
}

export async function completeOrder(orderId: string) {
  await workflowService.complete(orderId);
}
