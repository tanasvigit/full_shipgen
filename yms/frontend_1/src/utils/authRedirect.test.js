import { hasPermission, MOD } from "../constants/permissions";
import { resolvePostLoginPath } from "../utils/authRedirect";

const managerPerms = [
  "module.control_tower",
  "module.appointments",
  "module.queue",
  "module.yard_map",
  "module.vehicles",
  "module.docks",
  "flow.check_in",
];

describe("resolvePostLoginPath", () => {
  it("blocks post-login redirect to modules the role cannot access", () => {
    expect(resolvePostLoginPath(managerPerms, "/gate")).toBe("/");
    expect(resolvePostLoginPath(managerPerms, "/docks")).toBe("/docks");
  });
});

describe("yard_manager module guards", () => {
  it("does not grant gate module from flow.check_in alone", () => {
    expect(hasPermission(managerPerms, MOD.GATE)).toBe(false);
  });
});
