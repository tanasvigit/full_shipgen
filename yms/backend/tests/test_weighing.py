"""Weighing — tare at queue, gross at dock, net = gross − tare."""

from decimal import Decimal

from services.weighing_service import weighing_payload


def test_weighing_payload_formats_decimals():
    payload = weighing_payload(
        {
            "id": "q1",
            "tare_weight_kg": Decimal("4000.00"),
            "gross_weight_kg": Decimal("12000.50"),
            "net_weight_kg": Decimal("8000.50"),
        }
    )
    assert payload["queueEntryId"] == "q1"
    assert payload["tareWeightKg"] == 4000.0
    assert payload["grossWeightKg"] == 12000.5
    assert payload["netWeightKg"] == 8000.5


def test_queue_entry_out_includes_weighing_fields():
    from schemas import QueueEntryOut

    row = QueueEntryOut(
        id="b834c8b1-ada2-4dd7-b6b7-9a540d1753d4",
        appointment_id="22222222-2222-2222-2222-222222222222",
        vehicle_id="11111111-1111-1111-1111-111111111111",
        queue_number="Q-100",
        queue_type="LOADING",
        priority_score=10,
        status="DOCK_ASSIGNED",
        created_at="2026-06-23T12:00:00+00:00",
        updated_at="2026-06-23T12:00:00+00:00",
        tare_weight_kg=4200.0,
    )
    assert row.model_dump()["tare_weight_kg"] == 4200.0
