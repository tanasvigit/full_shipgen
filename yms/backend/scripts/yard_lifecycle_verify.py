"""Live API lifecycle verification — zone + KPI snapshot after each step."""
import json
import urllib.request
import uuid
from datetime import datetime, timezone

BASE = "http://localhost:8001/api"


def req(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        headers={"Content-Type": "application/json"} if data else {},
        method=method,
    )
    with urllib.request.urlopen(r) as res:
        return json.loads(res.read())


def snapshot(vehicle_id):
    vehicles = req("GET", "/vehicles")
    zones = req("GET", "/yard/zones")
    dash = req("GET", "/yard/dashboard")
    v = next((x for x in vehicles if x["id"] == vehicle_id), None)
    zone = next((z for z in zones if v and str(z["id"]) == str(v.get("current_zone_id") or "")), None)
    return {
        "vehicle_status": v.get("status") if v else None,
        "current_zone_id": v.get("current_zone_id") if v else None,
        "zone_name": zone.get("zone_name") if zone else None,
        "zone_type": zone.get("zone_type") if zone else None,
        "map_code": zone.get("map_code") if zone else None,
        "zone_occupancy": zone.get("currentOccupancy") if zone else None,
        "dashboard_occupancy": dash.get("currentOccupancy"),
        "dashboard_utilization_pct": dash.get("yardUtilizationPct"),
        "total_zones": dash.get("totalZones"),
    }


def main():
    plate = f"LC-{uuid.uuid4().hex[:6].upper()}"
    print(f"=== Lifecycle verify plate={plate} ===\n")

    vehicle = req(
        "POST",
        "/vehicles",
        {
            "vehicle_number": plate,
            "vehicle_type": "TRUCK",
            "ownership_type": "outside",
            "transporter_name": "Lifecycle Test",
            "status": "SCHEDULED",
            "operation_type": "Loading",
            "material_type": "GENERAL",
            "registration_source": "manual",
        },
    )
    vid = vehicle["id"]
    print("CREATE VEHICLE", json.dumps(snapshot(vid), indent=2))

    appt = req(
        "POST",
        "/appointments",
        {
            "booking_reference": f"BK-{plate}",
            "vehicle_id": vid,
            "customer_name": "Test",
            "shipment_reference": "Loading|General|Hub",
            "booking_date": datetime.now(timezone.utc).date().isoformat(),
            "reporting_time": datetime.now(timezone.utc).isoformat(),
            "scheduled_slot": "08:00",
            "gate_number": "G1",
            "priority": 1,
            "status": "SCHEDULED",
        },
    )
    print("APPOINTMENT", json.dumps(snapshot(vid), indent=2))

    req("POST", f"/gate/vehicles/{vid}/arrived", {"gate_id": "G1", "created_by": "verify"})
    print("ARRIVED", json.dumps(snapshot(vid), indent=2))

    req(
        "POST",
        f"/gate/vehicles/{vid}/approve-entry",
        {"gate_id": "G1", "created_by": "verify", "queue_number": f"Q-{plate}", "queue_type": "Loading"},
    )
    print("APPROVE ENTRY (WAITING)", json.dumps(snapshot(vid), indent=2))

    queues = req("GET", "/queue-entries")
    q = next((x for x in queues if x["vehicle_id"] == vid), None)
    if not q:
        raise SystemExit("No queue entry")
    req("POST", f"/flow/queue-entries/{q['id']}/call", {})
    print("CALLED", json.dumps(snapshot(vid), indent=2))

    docks = req("GET", "/docks")
    dock = next(
        (d for d in docks if d["status"] == "AVAILABLE" and not d.get("current_vehicle_id")),
        next((d for d in docks if d["status"] == "AVAILABLE"), None),
    )
    if not dock:
        raise SystemExit("No available dock for assignment")
    req("POST", f"/flow/queue-entries/{q['id']}/assign-dock", {"dock_id": dock["id"], "created_by": "verify"})
    print("DOCK ASSIGNED", json.dumps(snapshot(vid), indent=2))

    labor = req("GET", "/labor")
    team = next((t for t in labor if t.get("status") in ("AVAILABLE", "ON_DUTY")), None)
    if team:
        try:
            req("POST", f"/docks/{dock['id']}/assign-labor", {"labor_id": team["id"], "created_by": "verify"})
            print("LABOR ASSIGNED", json.dumps(snapshot(vid), indent=2))
        except Exception as exc:
            print("LABOR ASSIGNED (skipped)", exc)

    req("POST", f"/flow/vehicles/{vid}/transition", {"status": "LOADING", "created_by": "verify"})
    print("LOADING", json.dumps(snapshot(vid), indent=2))

    req("POST", f"/flow/vehicles/{vid}/transition", {"status": "COMPLETED", "created_by": "verify"})
    print("COMPLETED→EXIT_HOLDING", json.dumps(snapshot(vid), indent=2))

    req("POST", f"/gate/vehicles/{vid}/verify-exit", {"gate_id": "G1", "created_by": "verify"})
    print("EXIT VERIFIED", json.dumps(snapshot(vid), indent=2))

    req("POST", f"/gate/vehicles/{vid}/gate-out", {"gate_id": "G1", "created_by": "verify"})
    print("GATE OUT", json.dumps(snapshot(vid), indent=2))


if __name__ == "__main__":
    main()
