import { listStagedAttachments, updatePodAttachmentState } from "@/src/pod/staging";
import { flushOfflineQueue } from "@/src/offline/processor";

export async function retryFailedPodUploads(companyUuid: string) {
  const staged = await listStagedAttachments(companyUuid);
  const failed = staged.filter((item) => item.state === "failed");
  for (const item of failed) {
    await updatePodAttachmentState(item.id, "queued");
  }
  await flushOfflineQueue(companyUuid);
  return failed.length;
}
