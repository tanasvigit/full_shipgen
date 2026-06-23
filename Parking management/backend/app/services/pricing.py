import uuid
from decimal import Decimal

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.exceptions import not_found
from app.models.pricing import PricingRule
from app.schemas.pricing import PricingRuleUpdateRequest
from app.services.audit import write_audit_log


def list_pricing_rules(db: Session) -> list[dict]:
    rules = db.scalars(select(PricingRule).order_by(PricingRule.category)).all()
    return [_serialize_rule(rule) for rule in rules]


def update_pricing_rule(db: Session, rule_id: str, payload: PricingRuleUpdateRequest, actor) -> dict:
    rule = _get_pricing_rule_by_public_id(db, rule_id)
    if payload.basePrice is not None:
        rule.base_price = payload.basePrice
    if payload.perHour is not None:
        rule.per_hour = payload.perHour
    if payload.maxDaily is not None:
        rule.max_daily = payload.maxDaily
    if payload.isActive is not None:
        rule.is_active = payload.isActive
    write_audit_log(
        db,
        actor=actor,
        action="Pricing Updated",
        details=f"Updated pricing for {rule.category}",
    )
    db.commit()
    db.refresh(rule)
    return _serialize_rule(rule)


def _get_pricing_rule_by_public_id(db: Session, rule_id: str) -> PricingRule:
    filters = [PricingRule.external_code == rule_id]
    try:
        filters.append(PricingRule.id == uuid.UUID(rule_id))
    except ValueError:
        pass

    rule = db.scalar(select(PricingRule).where(or_(*filters)))
    if not rule:
        raise not_found("Pricing rule")
    return rule


def _serialize_rule(rule: PricingRule) -> dict:
    return {
        "id": rule.external_code or str(rule.id),
        "category": rule.category,
        "basePrice": Decimal(rule.base_price),
        "perHour": Decimal(rule.per_hour),
        "maxDaily": Decimal(rule.max_daily),
        "isActive": rule.is_active,
    }
