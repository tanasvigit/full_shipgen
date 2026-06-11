import { describe, expect, it, vi, beforeEach } from "vitest";

const alertSpy = vi.fn();

vi.mock("react-native", () => ({
  Alert: {
    alert: (...args: unknown[]) => alertSpy(...args),
  },
}));

import { confirmAction } from "./confirmAction";

describe("confirmAction", () => {
  beforeEach(() => {
    alertSpy.mockReset();
    alertSpy.mockImplementation((_title, _message, buttons) => {
      const confirm = (buttons as Array<{ text?: string; onPress?: () => void }>)?.find(
        (button) => button.text === "Dispatch"
      );
      confirm?.onPress?.();
    });
  });

  it("resolves true when user confirms", async () => {
    await expect(
      confirmAction("Dispatch order?", "Send to driver.", { confirmLabel: "Dispatch" })
    ).resolves.toBe(true);
  });
});
