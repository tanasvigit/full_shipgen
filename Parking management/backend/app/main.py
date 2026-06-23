import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routers import api_router
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.services.ocr import warm_ocr_model

settings = get_settings()
logger = logging.getLogger(__name__)
allow_local_dev_cors = settings.cors_origin_regex is not None


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not os.getenv("PYTEST_CURRENT_TEST"):
        try:
            warm_ocr_model()
            logger.info("OCR reader warmed during startup")
        except Exception:
            logger.exception("Failed to warm OCR reader during startup")
    yield


app = FastAPI(title="Security Systems API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    # Vite can move from 5173 to 5174/5175 when the default port is busy.
    # In local development, be permissive so browser auth flows keep working.
    allow_origins=["*"] if allow_local_dev_cors else settings.cors_origin_list,
    allow_origin_regex=None if allow_local_dev_cors else settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.detail)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")
