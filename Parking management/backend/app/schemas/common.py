from pydantic import BaseModel, ConfigDict


class ErrorResponse(BaseModel):
    error: str
    message: str


class CategorySlotStats(BaseModel):
    capacity: int
    occupied: int
    available: int


class MessageResponse(BaseModel):
    message: str


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)
