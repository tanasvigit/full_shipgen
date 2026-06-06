import { apiRequest } from "@/src/lib/api";
import { preparePhotoBase64 } from "@/src/lib/photoBase64";

async function capture(orderId: string, kind: "capture-signature" | "capture-photo" | "capture-qr", body: unknown) {
  const id = String(orderId);
  let lastError: unknown = null;

  for (const method of ["POST", "PATCH"] as const) {
    try {
      await apiRequest(`/orders/${id}/${kind}`, { method, body });
      return;
    } catch (error: unknown) {
      lastError = error;
      if ((error as { status?: number })?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("POD upload failed");
}

export const podService = {
  captureSignature(orderId: string, value: string) {
    return capture(orderId, "capture-signature", { signature: value });
  },
  async capturePhoto(orderId: string, value: string) {
    const photo = await preparePhotoBase64(value);
    return capture(orderId, "capture-photo", { photos: [photo] });
  },
  captureQr(orderId: string, value: string) {
    return capture(orderId, "capture-qr", { code: value });
  },
};

