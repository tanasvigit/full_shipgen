import { enqueueOfflineItem } from "@/src/offline/processor";
import { getNetworkOnline } from "@/src/offline/network";
import { podService } from "@/src/services/podService";
import {
  removePodAttachment,
  stagePodAttachment,
  updatePodAttachmentState,
  type PodAttachment,
} from "@/src/pod/staging";

async function uploadStaged(attachment: PodAttachment) {
  await updatePodAttachmentState(attachment.id, "uploading");
  if (attachment.kind === "signature") {
    await podService.captureSignature(attachment.orderId, attachment.value);
  } else if (attachment.kind === "photo") {
    await podService.capturePhoto(attachment.orderId, attachment.value);
  } else {
    await podService.captureQr(attachment.orderId, attachment.value);
  }
  await updatePodAttachmentState(attachment.id, "uploaded");
  await removePodAttachment(attachment.id);
}

export async function uploadPodWithStaging(params: {
  companyUuid: string;
  userId: string;
  orderId: string;
  kind: PodAttachment["kind"];
  value: string;
}) {
  const attachment = await stagePodAttachment({
    orderId: params.orderId,
    companyUuid: params.companyUuid,
    kind: params.kind,
    value: params.value,
  });

  if (!getNetworkOnline()) {
    await updatePodAttachmentState(attachment.id, "queued");
    await enqueueOfflineItem({
      companyUuid: params.companyUuid,
      userId: params.userId,
      type: `pod.${params.kind}` as "pod.signature" | "pod.photo" | "pod.qr",
      payload: {
        orderId: params.orderId,
        value: params.value,
        attachmentId: attachment.id,
      },
      dedupeKey: `pod:${attachment.uploadId}`,
    });
    return { attachment, queued: true };
  }

  try {
    await uploadStaged(attachment);
    return { attachment, queued: false };
  } catch (error) {
    await updatePodAttachmentState(attachment.id, "failed");
    await enqueueOfflineItem({
      companyUuid: params.companyUuid,
      userId: params.userId,
      type: `pod.${params.kind}` as "pod.signature" | "pod.photo" | "pod.qr",
      payload: {
        orderId: params.orderId,
        value: params.value,
        attachmentId: attachment.id,
      },
      dedupeKey: `pod:${attachment.uploadId}`,
    });
    throw error;
  }
}
