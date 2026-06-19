import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from auth_middleware import ModuleAccessMiddleware
from db import close_db, init_db
from routers.auth import router as auth_router
from routers.search import router as search_router
from routers.status import router as status_router
from routers.queue import router as queue_router
from routers.yard import router as yard_router
from routers.yms import router as yms_router
from routers.gate import router as gate_router
from routers.reports import router as reports_router
from routers.control_tower import router as control_tower_router
from routers.loading_ops import router as loading_ops_router
from routers.admin import router as admin_router
from services.auth_service import validate_jwt_secret

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")
api_router.include_router(status_router)
api_router.include_router(auth_router)
api_router.include_router(search_router)
api_router.include_router(yms_router)
api_router.include_router(yard_router)
api_router.include_router(queue_router)
api_router.include_router(gate_router)
api_router.include_router(reports_router)
api_router.include_router(control_tower_router)
api_router.include_router(loading_ops_router)
api_router.include_router(admin_router)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(ModuleAccessMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    validate_jwt_secret()
    await init_db()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_db()