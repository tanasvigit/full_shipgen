from fastapi import APIRouter, Query

from schemas import GlobalSearchOut
from services.search_service import global_search

router = APIRouter(tags=["search"])


@router.get("/search", response_model=GlobalSearchOut)
async def global_search_endpoint(
    q: str = Query(..., min_length=1, max_length=128),
    limit_per_group: int = Query(4, ge=1, le=20),
):
    data = await global_search(q, limit_per_group=limit_per_group)
    return GlobalSearchOut(**data)
