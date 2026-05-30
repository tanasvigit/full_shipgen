import type { EnqueueInput, QueueItem, QueueItemState } from "@/src/offline/types";
import { loadQueueItems, saveQueueItems } from "@/src/offline/persistence";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class OfflineQueue {
  private items: QueueItem[] = [];
  private loaded = false;

  async ensureLoaded() {
    if (this.loaded) return;
    this.items = await loadQueueItems();
    this.loaded = true;
  }

  async persist() {
    await saveQueueItems(this.items);
  }

  getSnapshot() {
    return [...this.items];
  }

  getPending(companyUuid?: string) {
    return this.items.filter(
      (item) =>
        (item.state === "pending" || item.state === "failed") &&
        (!companyUuid || item.companyUuid === companyUuid)
    );
  }

  getDeadLetter(companyUuid?: string) {
    return this.items.filter(
      (item) => item.state === "dead-letter" && (!companyUuid || item.companyUuid === companyUuid)
    );
  }

  async enqueue(input: EnqueueInput) {
    await this.ensureLoaded();

    if (input.dedupeKey) {
      const existing = this.items.find(
        (item) =>
          item.dedupeKey === input.dedupeKey &&
          item.companyUuid === input.companyUuid &&
          (item.state === "pending" || item.state === "failed" || item.state === "syncing")
      );
      if (existing) {
        existing.payload = input.payload;
        existing.state = "pending";
        await this.persist();
        return existing;
      }
    }

    const item: QueueItem = {
      id: createId(),
      companyUuid: input.companyUuid,
      userId: input.userId,
      type: input.type,
      payload: input.payload,
      retries: 0,
      createdAt: Date.now(),
      state: "pending",
      dedupeKey: input.dedupeKey,
    };

    this.items.push(item);
    await this.persist();
    return item;
  }

  async updateState(id: string, state: QueueItemState, patch?: Partial<QueueItem>) {
    await this.ensureLoaded();
    const item = this.items.find((row) => row.id === id);
    if (!item) return null;
    item.state = state;
    if (patch) Object.assign(item, patch);
    await this.persist();
    return item;
  }

  async remove(id: string) {
    await this.ensureLoaded();
    this.items = this.items.filter((item) => item.id !== id);
    await this.persist();
  }

  async purgeTenant(companyUuid: string) {
    await this.ensureLoaded();
    this.items = this.items.filter((item) => item.companyUuid !== companyUuid);
    await this.persist();
  }
}

export const offlineQueue = new OfflineQueue();
