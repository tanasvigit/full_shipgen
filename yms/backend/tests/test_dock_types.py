"""Dock type validation — standard + custom supported types."""

import pytest
from fastapi import HTTPException

from services.yms_service import (
    _validate_dock_material_types,
    _validate_dock_vehicle_types,
)


def test_validate_standard_vehicle_types_only():
    result = _validate_dock_vehicle_types(["TRUCK", "CONTAINER"])
    assert result == ["TRUCK", "CONTAINER"]


def test_validate_custom_vehicle_type():
    result = _validate_dock_vehicle_types(["TRUCK", "Refrigerated Trailer", "BULK CARRIER"])
    assert result == ["TRUCK", "REFRIGERATED TRAILER", "BULK CARRIER"]


def test_validate_custom_material_types():
    result = _validate_dock_material_types(["GENERAL", "Electronics", "Automotive Parts"])
    assert result == ["GENERAL", "ELECTRONICS", "AUTOMOTIVE PARTS"]


def test_validate_multiple_custom_values():
    result = _validate_dock_vehicle_types(
        ["TRUCK", "CONTAINER", "REFRIGERATED TRAILER", "BULK CARRIER"]
    )
    assert len(result) == 4


def test_rejects_reserved_custom_keyword_in_payload():
    with pytest.raises(HTTPException) as exc:
        _validate_dock_vehicle_types(["CUSTOM"])
    assert exc.value.status_code == 400


def test_rejects_empty_vehicle_types():
    with pytest.raises(HTTPException) as exc:
        _validate_dock_vehicle_types([])
    assert exc.value.status_code == 400


def test_rejects_invalid_custom_vehicle_type():
    with pytest.raises(HTTPException) as exc:
        _validate_dock_vehicle_types(["TRUCK", "!!!"])
    assert exc.value.status_code == 400
