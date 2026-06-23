from fastapi import APIRouter

from app.api.routers import audit, auth, dashboard, floors, hardware, monitoring, ocr, pricing, reports, tickets, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(floors.router, prefix="/floors", tags=["floors"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(ocr.router, prefix="/ocr", tags=["ocr"])
api_router.include_router(pricing.router, prefix="/pricing", tags=["pricing"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(hardware.router, prefix="/hardware", tags=["hardware"])
api_router.include_router(audit.router, prefix="/audit-logs", tags=["audit"])
