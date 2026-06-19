import { isMapLayoutZone, resolveMapCode, zonePanelTitle } from "./zoneDisplay";

describe("zoneDisplay", () => {
  test("isMapLayoutZone identifies A–F map tiles only", () => {
    expect(isMapLayoutZone({ mapCode: "A", code: "A", name: "Loading" })).toBe(true);
    expect(isMapLayoutZone({ mapCode: "E", name: "Cold Chain" })).toBe(true);
    expect(isMapLayoutZone({ zoneCode: "ZN-GATE-IN", zoneType: "GATE_IN", name: "Gate In" })).toBe(false);
    expect(isMapLayoutZone({ code: "ZN-GATE-IN", name: "Gate In" })).toBe(false);
  });

  test("zonePanelTitle uses map code for layout zones", () => {
    expect(zonePanelTitle({ mapCode: "C", name: "Documentation" })).toBe("Zone C — Documentation");
  });

  test("zonePanelTitle uses name and zone code for operational zones", () => {
    expect(
      zonePanelTitle({ name: "Gate In", zoneCode: "ZN-GATE-IN", zoneType: "GATE_IN" })
    ).toBe("Gate In — ZN-GATE-IN");
  });
});
