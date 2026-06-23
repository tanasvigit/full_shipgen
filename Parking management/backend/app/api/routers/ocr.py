import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.deps import CurrentUser, require_permissions
from app.core.exceptions import AppError
from app.schemas.ocr import PlateOcrResponse
from app.services.ocr import extract_plate_from_image_bytes

logger = logging.getLogger(__name__)

router = APIRouter()
PlateOcrUser = Annotated[CurrentUser, Depends(require_permissions("tickets.create"))]

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


@router.post("/plate", response_model=PlateOcrResponse)
def detect_plate(_: PlateOcrUser, file: UploadFile = File(...)) -> PlateOcrResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise AppError(
            "INVALID_IMAGE_TYPE",
            "Only JPEG, PNG, and WebP image files are allowed.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    try:
        image_bytes = file.file.read(MAX_UPLOAD_BYTES + 1)
    except Exception as exc:
        logger.exception("Failed to read OCR upload")
        raise AppError(
            "OCR_UPLOAD_READ_FAILED",
            "Could not read the uploaded image.",
            status_code=status.HTTP_400_BAD_REQUEST,
        ) from exc
    finally:
        file.file.close()

    if not image_bytes:
        raise AppError(
            "EMPTY_IMAGE_FILE",
            "Uploaded image is empty.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise AppError(
            "IMAGE_TOO_LARGE",
            "Uploaded image must be 10 MB or smaller.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    try:
        result = extract_plate_from_image_bytes(image_bytes)
    except Exception as exc:
        logger.exception("OCR pipeline failed")
        raise AppError(
            "OCR_PROCESSING_FAILED",
            "Failed to process the uploaded image.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        ) from exc

    return PlateOcrResponse(
        success=result.success,
        plate_number=result.plate_number,
        raw_text=result.raw_text,
        confidence=result.confidence,
        message=result.message,
    )
