import { apiRequest } from "@/src/lib/api";

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
  capturePhoto(orderId: string, value: string) {
    return capture(orderId, "capture-photo", { photo: value });
  },
  captureQr(orderId: string, value: string) {
    return capture(orderId, "capture-qr", { qr: value });
  },
};

