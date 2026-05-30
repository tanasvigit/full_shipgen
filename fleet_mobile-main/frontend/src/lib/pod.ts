import { podService } from "@/src/services/podService";

export async function captureSignature(orderId: string, value: string) {
  await podService.captureSignature(orderId, value);
}

export async function capturePhoto(orderId: string, value: string) {
  await podService.capturePhoto(orderId, value);
}

export async function captureQr(orderId: string, value: string) {
  await podService.captureQr(orderId, value);
}
