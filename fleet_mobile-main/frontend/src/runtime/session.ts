export type RuntimeSession = {
  companyUuid: string;
  userId: string;
  driverPublicId?: string | null;
  activeOrderId?: string;
};

let session: RuntimeSession | null = null;

export function getRuntimeSession() {
  return session;
}

export function setRuntimeSession(next: RuntimeSession | null) {
  session = next;
}
