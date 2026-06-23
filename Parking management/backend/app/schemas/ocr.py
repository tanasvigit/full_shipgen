from pydantic import BaseModel, Field


class PlateOcrResponse(BaseModel):
    success: bool
    plate_number: str | None = None
    raw_text: str = ""
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    message: str | None = None
