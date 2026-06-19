import uuid
from datetime import datetime, timezone

from fastapi import APIRouter

from db import get_pool
from schemas import StatusCheck, StatusCheckCreate


router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Hello World"}


@router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    pool = get_pool()
    status_obj = StatusCheck(
        id=str(uuid.uuid4()),
        client_name=input.client_name,
        timestamp=datetime.now(timezone.utc),
    )
    await pool.execute(
        """
        INSERT INTO status_checks (id, client_name, timestamp)
        VALUES ($1::uuid, $2, $3)
        """,
        status_obj.id,
        status_obj.client_name,
        status_obj.timestamp,
    )
    return status_obj


@router.get("/status", response_model=list[StatusCheck])
async def get_status_checks():
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT id::text AS id, client_name, timestamp
        FROM status_checks
        ORDER BY timestamp DESC
        LIMIT 1000
        """
    )
    return [StatusCheck(**dict(row)) for row in rows]
