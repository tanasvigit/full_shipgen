"""Appointment audit event and validation tests."""

from enums import STATUS_TRANSITIONS, YMS_STATUSES


def test_draft_status_in_model():
    assert "DRAFT" in YMS_STATUSES
    assert "SCHEDULED" in STATUS_TRANSITIONS["DRAFT"]


def test_appointment_lifecycle_statuses():
    for s in [
        "DRAFT", "SCHEDULED", "CHECKED_IN", "WAITING", "CALLED", "DOCK_ASSIGNED",
        "RESOURCE_PENDING", "READY_FOR_LOADING", "LOADING", "COMPLETED", "EXITED",
    ]:
        assert s in YMS_STATUSES
