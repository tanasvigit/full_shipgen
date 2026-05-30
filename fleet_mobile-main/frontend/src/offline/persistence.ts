import { storage } from "@/src/utils/storage";
import type { QueueItem } from "@/src/offline/types";

const QUEUE_KEY = "fleet_mobile.offline.queue";

export async function loadQueueItems(): Promise<QueueItem[]> {
  const items = await storage.getItem<QueueItem[]>(QUEUE_KEY, []);
  return Array.isArray(items) ? items : [];
}

export async function saveQueueItems(items: QueueItem[]) {
  await storage.setItem(QUEUE_KEY, items);
}

export async function clearQueueForTenant(companyUuid: string) {
  const items = await loadQueueItems();
  const next = items.filter((item) => item.companyUuid !== companyUuid);
  await saveQueueItems(next);
  return items.length - next.length;
}
