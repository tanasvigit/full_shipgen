from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, DbSession, require_permissions
from app.schemas.common import MessageResponse
from app.schemas.floor import FacilitySummaryResponse, FloorCreateRequest, FloorResponse, FloorUpdateRequest
from app.services import floors as floors_service

router = APIRouter()
FloorReader = Annotated[CurrentUser, Depends(require_permissions("floors.summary", "floors.monitor", "floors.manage"))]
FloorManager = Annotated[CurrentUser, Depends(require_permissions("floors.manage"))]


@router.get("", response_model=list[FloorResponse])
def get_floors(db: DbSession, _: FloorReader) -> list[FloorResponse]:
    return floors_service.list_floors(db)


@router.get("/summary", response_model=FacilitySummaryResponse)
def get_floor_summary(db: DbSession, _: FloorReader) -> FacilitySummaryResponse:
    return floors_service.get_facility_summary(db)


@router.post("", response_model=FloorResponse)
def create_floor(payload: FloorCreateRequest, db: DbSession, actor: FloorManager) -> FloorResponse:
    return floors_service.create_floor(db, payload, actor)


@router.patch("/{floor_id}", response_model=FloorResponse)
def update_floor(floor_id: str, payload: FloorUpdateRequest, db: DbSession, actor: FloorManager) -> FloorResponse:
    return floors_service.update_floor(db, floor_id, payload, actor)


@router.delete("/{floor_id}", response_model=MessageResponse)
def delete_floor(floor_id: str, db: DbSession, actor: FloorManager) -> MessageResponse:
    floors_service.delete_floor(db, floor_id, actor)
    return MessageResponse(message="Floor deleted")
