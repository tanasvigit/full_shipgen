from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class PricingRuleResponse(ORMModel):
    id: str
    category: str
    basePrice: Decimal
    perHour: Decimal
    maxDaily: Decimal
    isActive: bool


class PricingRuleUpdateRequest(BaseModel):
    basePrice: Decimal | None = Field(default=None, ge=0)
    perHour: Decimal | None = Field(default=None, ge=0)
    maxDaily: Decimal | None = Field(default=None, ge=0)
    isActive: bool | None = None
