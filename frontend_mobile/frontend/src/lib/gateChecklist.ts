import type { GateCheck } from "@/src/services/gateService";

export function patchExitCheck(
  checks: GateCheck[],
  field: string,
  passed: boolean,
): GateCheck[] {
  return checks.map((check) => (check.field === field ? { ...check, passed } : check));
}
