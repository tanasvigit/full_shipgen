from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from io import BytesIO
from typing import Any

from PIL import Image, ImageEnhance, ImageOps

from app.services.ocr.plate_parser import extract_plate_candidates

MAX_IMAGE_SIDE = 1280
ALLOWLIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
OCR_UNAVAILABLE_MESSAGE = (
    "Plate OCR is not available in this environment. Enter the plate number manually."
)


@dataclass(frozen=True)
class PlateOcrResult:
    success: bool
    plate_number: str | None
    raw_text: str
    confidence: float
    message: str | None = None


def _ocr_available() -> bool:
    try:
        import easyocr  # noqa: F401
    except ImportError:
        return False
    return True


@lru_cache(maxsize=1)
def _get_reader() -> Any:
    import easyocr

    return easyocr.Reader(["en"], gpu=False, verbose=False)


def warm_ocr_model() -> None:
    if not _ocr_available():
        return
    _get_reader()


def extract_plate_from_image_bytes(image_bytes: bytes) -> PlateOcrResult:
    if not _ocr_available():
        return PlateOcrResult(
            success=False,
            plate_number=None,
            raw_text="",
            confidence=0.0,
            message=OCR_UNAVAILABLE_MESSAGE,
        )

    image = _load_image(image_bytes)
    if image is None:
        return PlateOcrResult(
            success=False,
            plate_number=None,
            raw_text="",
            confidence=0.0,
            message="Could not read the uploaded image.",
        )

    reader = _get_reader()
    lines = _read_lines(reader, image)
    plate_number, raw_text, confidence = _pick_best_plate(lines)

    if not plate_number:
        focus_crop = _build_focus_crop(image)
        if focus_crop is not None:
            crop_lines = _read_lines(reader, focus_crop)
            lines.extend(crop_lines)
            plate_number, raw_text, confidence = _pick_best_plate(lines)

    if plate_number:
        return PlateOcrResult(
            success=True,
            plate_number=plate_number,
            raw_text=raw_text,
            confidence=round(confidence, 4),
        )

    return PlateOcrResult(
        success=False,
        plate_number=None,
        raw_text=raw_text,
        confidence=round(confidence, 4),
        message="No plate-like text was detected. Try a clearer image with the plate visible.",
    )


def _load_image(image_bytes: bytes) -> Image.Image | None:
    try:
        image = Image.open(BytesIO(image_bytes))
    except Exception:
        return None

    image = ImageOps.exif_transpose(image).convert("RGB")
    width, height = image.size
    max_side = max(width, height)
    if max_side <= MAX_IMAGE_SIDE:
        return image

    scale = MAX_IMAGE_SIDE / max_side
    return image.resize((int(width * scale), int(height * scale)), Image.Resampling.LANCZOS)


def _build_focus_crop(image: Image.Image) -> Image.Image | None:
    width, height = image.size
    if width < 240 or height < 160:
        return None

    crop = image.crop((int(width * 0.18), int(height * 0.45), int(width * 0.82), int(height * 0.88)))
    grayscale = ImageOps.grayscale(crop)
    return ImageOps.autocontrast(ImageEnhance.Contrast(grayscale).enhance(1.35))


def _read_lines(reader: Any, image: Image.Image) -> list[tuple[str, float]]:
    import numpy as np

    try:
        result = reader.readtext(np.asarray(image), detail=1, paragraph=False, allowlist=ALLOWLIST)
    except Exception:
        return []

    lines: list[tuple[str, float]] = []
    for item in result:
        if len(item) < 3:
            continue
        text = str(item[1]).strip()
        confidence = float(item[2])
        if text:
            lines.append((text, confidence))
    return lines


def _pick_best_plate(lines: list[tuple[str, float]]) -> tuple[str | None, str, float]:
    if not lines:
        return None, "", 0.0

    raw_parts: list[str] = []
    best_plate: str | None = None
    best_confidence = 0.0
    best_score = -1.0

    for text, confidence in lines:
        raw_parts.append(text)
        for candidate in extract_plate_candidates(text):
            score = _candidate_score(candidate, confidence)
            if score > best_score:
                best_plate = candidate
                best_confidence = confidence
                best_score = score

    raw_text = " | ".join(dict.fromkeys(part for part in raw_parts if part))
    if best_plate:
        return best_plate, raw_text, best_confidence

    merged_candidates = extract_plate_candidates(raw_text)
    if merged_candidates:
        return merged_candidates[0], raw_text, max((confidence for _, confidence in lines), default=0.0)

    return None, raw_text, 0.0


def _candidate_score(candidate: str, confidence: float) -> float:
    score = confidence
    if len(candidate) == 10:
        score += 0.15
    elif len(candidate) in {9, 11}:
        score += 0.1
    return score
