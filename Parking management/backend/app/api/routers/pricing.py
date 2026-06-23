from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_permissions
from app.schemas.pricing import PricingRuleResponse, PricingRuleUpdateRequest
from app.services import pricing as pricing_service

router = APIRouter()
PricingManager = Annotated[object, Depends(require_permissions("pricing.configure"))]


@router.get("", response_model=list[PricingRuleResponse])
def get_pricing(db: DbSession, _: PricingManager) -> list[PricingRuleResponse]:
    return pricing_service.list_pricing_rules(db)


@router.patch("/{rule_id}", response_model=PricingRuleResponse)
def update_pricing(rule_id: str, payload: PricingRuleUpdateRequest, db: DbSession, actor: PricingManager) -> PricingRuleResponse:
    return pricing_service.update_pricing_rule(db, rule_id, payload, actor)
