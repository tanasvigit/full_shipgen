import { storage } from "@/src/utils/storage";

export type PodAttachmentState = "staged" | "queued" | "uploading" | "uploaded" | "failed";

export type PodAttachment = {
  id: string;
  orderId: string;
  companyUuid: string;
  kind: "signature" | "photo" | "qr";
  value: string;
  state: PodAttachmentState;
  createdAt: number;
  uploadId: string;
};

const STAGING_KEY = "fleet_mobile.pod.staging";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function listStagedAttachments(companyUuid?: string) {
  const all = await storage.getItem<PodAttachment[]>(STAGING_KEY, []);
  if (!companyUuid) return all;
  return all.filter((item) => item.companyUuid === companyUuid);
}

export async function stagePodAttachment(input: {
  orderId: string;
  companyUuid: string;
  kind: PodAttachment["kind"];
  value: string;
}) {
  const all = await listStagedAttachments();
  const attachment: PodAttachment = {
    id: createId(),
    orderId: input.orderId,
    companyUuid: input.companyUuid,
    kind: input.kind,
    value: input.value,
    state: "staged",
    createdAt: Date.now(),
    uploadId: createId(),
  };
  all.push(attachment);
  await storage.setItem(STAGING_KEY, all);
  return attachment;
}

export async function updatePodAttachmentState(id: string, state: PodAttachmentState) {
  const all = await listStagedAttachments();
  const item = all.find((row) => row.id === id);
  if (!item) return null;
  item.state = state;
  await storage.setItem(STAGING_KEY, all);
  return item;
}

export async function removePodAttachment(id: string) {
  const all = await listStagedAttachments();
  const next = all.filter((row) => row.id !== id);
  await storage.setItem(STAGING_KEY, next);
}
