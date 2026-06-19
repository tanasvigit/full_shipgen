import loadingOpsApi, {
  NO_EQUIPMENT_ASSIGNED,
  NO_LABOR_ASSIGNED,
  buildActiveExceptionRows,
  buildCompletedOperations,
  isActiveQueueStatus,
  mapOperationRow,
  resolveAssignedEquipmentLabel,
  resolveAssignedLaborLabel,
} from "./loadingOpsApi";
import { ACTIVE_DOCK_QUEUE_STATUSES } from "./docksApi";

describe("loadingOpsApi Phase 1", () => {
  test("active queue statuses match backend ACTIVE_DOCK_QUEUE_STATUSES", () => {
    for (const status of ACTIVE_DOCK_QUEUE_STATUSES) {
      expect(isActiveQueueStatus(status)).toBe(true);
    }
    expect(isActiveQueueStatus("RESOURCE_PENDING")).toBe(true);
    expect(isActiveQueueStatus("READY_FOR_LOADING")).toBe(true);
    expect(isActiveQueueStatus("CALLED")).toBe(true);
    expect(isActiveQueueStatus("EXIT_HOLDING")).toBe(false);
  });

  test("mapOperationRow uses real labor and equipment only", () => {
    const queue = { id: "q1", status: "READY_FOR_LOADING", vehicle_id: "v1", appointment_id: "a1", dock_id: "d1" };
    const vehicle = { id: "v1", vehicle_number: "APXI1000", status: "READY_FOR_LOADING" };
    const dock = { id: "d1", dock_code: "DK-001", dock_name: "Dock 1" };
    const labor = [
      {
        id: "l1",
        team_code: "LT001",
        team_name: "Alpha Team",
        assigned_dock_id: "d1",
        assigned_vehicle_id: null,
        assigned_queue_entry_id: null,
        members_count: 4,
        assigned_count: 1,
        available_count: 3,
        status: "ASSIGNED",
      },
    ];
    const equipment = [
      {
        id: "e1",
        equipment_code: "EQ-001",
        equipment_name: "Forklift 1",
        assigned_vehicle_id: "v1",
        assigned_dock_id: null,
        assigned_queue_entry_id: null,
        status: "ASSIGNED",
      },
    ];

    const row = mapOperationRow(queue, vehicle, null, dock, [], equipment, labor);
    expect(row.laborTeam).toBe("LT001 · Alpha Team");
    expect(row.equipment).toBe("EQ-001 · Forklift 1");
    expect(row.laborTeam).not.toContain("Team Alpha");
  });

  test("mapOperationRow shows explicit unassigned labels", () => {
    const queue = { id: "q1", status: "DOCK_ASSIGNED", vehicle_id: "v1", dock_id: "d1" };
    const vehicle = { id: "v1", vehicle_number: "X1", status: "DOCK_ASSIGNED" };
    const dock = { id: "d1", dock_code: "DK-002" };
    const row = mapOperationRow(queue, vehicle, null, dock, [], [], []);
    expect(row.laborTeam).toBe(NO_LABOR_ASSIGNED);
    expect(row.equipment).toBe(NO_EQUIPMENT_ASSIGNED);
  });

  test("buildCompletedOperations does not require dock_id on queue", () => {
    const completedAt = new Date(Date.now() - 30 * 60000);
    const startedAt = new Date(completedAt.getTime() - 90 * 60000);
    const events = [
      {
        id: "e1",
        vehicle_id: "v1",
        queue_entry_id: "q1",
        dock_id: "d1",
        event_type: "LOADING_STARTED",
        event_time: startedAt.toISOString(),
      },
      {
        id: "e2",
        vehicle_id: "v1",
        queue_entry_id: "q1",
        dock_id: "d1",
        event_type: "LOADING_COMPLETED",
        event_time: completedAt.toISOString(),
      },
    ];
    const queues = [
      {
        id: "q1",
        vehicle_id: "v1",
        appointment_id: "a1",
        dock_id: null,
        status: "EXIT_HOLDING",
        updated_at: completedAt.toISOString(),
      },
    ];
    const vehicles = [{ id: "v1", vehicle_number: "APXI2000", status: "EXIT_HOLDING" }];
    const appointments = [{ id: "a1", vehicle_id: "v1", booking_reference: "APT-1001" }];
    const docks = [{ id: "d1", dock_code: "DK-006", dock_name: "Dock 6" }];

    const rows = buildCompletedOperations(queues, vehicles, appointments, docks, events);
    expect(rows).toHaveLength(1);
    expect(rows[0].plate).toBe("APXI2000");
    expect(rows[0].appointmentRef).toBe("APT-1001");
    expect(rows[0].dockUsed).toBe("DK-006");
    expect(rows[0].loadingDurationMin).toBe(90);
  });

  test("resolveAssignedLaborLabel matches queue entry assignment", () => {
    const labor = [
      {
        id: "l2",
        team_code: "LT002",
        team_name: "Bravo",
        assigned_queue_entry_id: "q9",
        assigned_dock_id: null,
        assigned_vehicle_id: null,
        members_count: 3,
        assigned_count: 1,
        available_count: 2,
        status: "ASSIGNED",
      },
    ];
    expect(resolveAssignedLaborLabel(labor, { queueEntryId: "q9" })).toBe("LT002 · Bravo");
  });

  test("resolveAssignedEquipmentLabel returns no-assigned constant", () => {
    expect(resolveAssignedEquipmentLabel([], { dockId: "d1" })).toBe(NO_EQUIPMENT_ASSIGNED);
  });
});

describe("loadingOpsApi Phase 2", () => {
  test("mapOperationRow uses session-based progress for LOADING", () => {
    const started = new Date(Date.now() - 38 * 60000).toISOString();
    const queue = { id: "q1", status: "LOADING", vehicle_id: "v1", appointment_id: "a1", dock_id: "d1" };
    const vehicle = { id: "v1", vehicle_number: "APXI1000", status: "LOADING" };
    const dock = { id: "d1", dock_code: "DK-006", estimated_service_time_min: 75 };
    const events = [
      { vehicle_id: "v1", event_type: "LOADING_STARTED", event_time: started },
    ];

    const row = mapOperationRow(queue, vehicle, null, dock, events, [], []);
    expect(row.progressPct).toBeGreaterThan(0);
    expect(row.progressPct).toBeLessThan(100);
    expect(row.etaCompletionLabel).toMatch(/^ETA /);
    expect(row.remainingLabel).toMatch(/min remaining/);
    expect(row.health).toBe("ON_TIME");
    expect(row.plannedDurationMin).toBe(75);
  });

  test("buildCompletedOperations records variance vs dock SLA", () => {
    const completedAt = new Date(Date.now() - 20 * 60000);
    const startedAt = new Date(completedAt.getTime() - 82 * 60000);
    const events = [
      {
        id: "e1",
        vehicle_id: "v1",
        dock_id: "d1",
        event_type: "LOADING_STARTED",
        event_time: startedAt.toISOString(),
      },
      {
        id: "e2",
        vehicle_id: "v1",
        dock_id: "d1",
        event_type: "LOADING_COMPLETED",
        event_time: completedAt.toISOString(),
      },
    ];
    const docks = [{ id: "d1", dock_code: "DK-006", estimated_service_time_min: 75 }];
    const vehicles = [{ id: "v1", vehicle_number: "APXI1000" }];

    const rows = buildCompletedOperations([], vehicles, [], docks, events);
    expect(rows).toHaveLength(1);
    expect(rows[0].loadingDurationMin).toBe(82);
    expect(rows[0].plannedDurationMin).toBe(75);
    expect(rows[0].varianceMin).toBe(7);
    expect(rows[0].varianceLabel).toBe("+7 min");
    expect(rows[0].progressPct).toBe(100);
  });
});

describe("loadingOpsApi default export", () => {
  test("exposes buildActiveExceptionRows for LoadingOps page", () => {
    expect(typeof loadingOpsApi.buildActiveExceptionRows).toBe("function");
    expect(loadingOpsApi.buildActiveExceptionRows).toBe(buildActiveExceptionRows);
  });
});
