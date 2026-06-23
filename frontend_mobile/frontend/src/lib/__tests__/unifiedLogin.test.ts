import { describe, expect, it } from "vitest";
import {
  isCredentialMismatchError,
  shouldTryYmsFirst,
  unifiedLoginErrorMessage,
} from "@/src/lib/unifiedLogin";

describe("unifiedLogin", () => {
  it("detects credential mismatch status codes", () => {
    expect(isCredentialMismatchError({ status: 401, message: "Unauthorized" })).toBe(true);
    expect(isCredentialMismatchError({ status: 500, message: "Server error" })).toBe(false);
    expect(isCredentialMismatchError(new Error("These credentials do not match our records."))).toBe(true);
  });

  it("routes yard operator identities to YMS first", () => {
    expect(shouldTryYmsFirst("yard.admin@shipgen.demo")).toBe(true);
    expect(shouldTryYmsFirst("tarunsai7032@gmail.com")).toBe(false);
  });

  it("prefers the yard error message when both attempts fail", () => {
    expect(
      unifiedLoginErrorMessage(
        new Error("Fleetops invalid"),
        new Error("YMS invalid"),
      ),
    ).toBe("YMS invalid");
  });
});
