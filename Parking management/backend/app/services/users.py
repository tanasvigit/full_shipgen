import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import AppError, forbidden, not_found
from app.core.security import hash_password
from app.models.auth import Role
from app.models.ticket import Payment, Ticket
from app.models.user import User
from app.schemas.user import UserCreateRequest, UserUpdateRequest
from app.services.audit import write_audit_log
from app.utils.serializers import serialize_user


def list_users(db: Session, search: str | None = None) -> list[dict]:
    query = select(User).options(joinedload(User.role)).order_by(User.created_at.desc())
    if search:
        pattern = f"%{search.lower()}%"
        query = query.where(or_(User.name.ilike(pattern), User.email.ilike(pattern)))
    users = db.scalars(query).all()
    return [serialize_user(user) for user in users]


def get_role_by_name(db: Session, role_name: str) -> Role:
    role = db.scalar(select(Role).where(Role.name == role_name))
    if not role:
        raise AppError("INVALID_ROLE", f"Role '{role_name}' does not exist.")
    return role


def create_user(db: Session, payload: UserCreateRequest, actor: User) -> dict:
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise AppError("EMAIL_EXISTS", "A user with this email already exists.")
    role = get_role_by_name(db, payload.role)
    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        status=payload.status,
        role_id=role.id,
    )
    db.add(user)
    db.flush()
    write_audit_log(db, actor=actor, action="User Created", details=f"Created user {user.email}")
    db.commit()
    db.refresh(user, attribute_names=["role"])
    return serialize_user(user)


def update_user(db: Session, user_id: str, payload: UserUpdateRequest, actor: User) -> dict:
    user = _get_user_by_public_id(db, user_id)
    if payload.name is not None:
        user.name = payload.name
    if payload.email is not None:
        user.email = payload.email.lower()
    if payload.password is not None:
        user.password_hash = hash_password(payload.password)
    if payload.role is not None:
        user.role = get_role_by_name(db, payload.role)
    if payload.status is not None:
        user.status = payload.status
    write_audit_log(db, actor=actor, action="User Updated", details=f"Updated user {user.email}")
    db.commit()
    db.refresh(user, attribute_names=["role"])
    return serialize_user(user)


def delete_user(db: Session, user_id: str, actor: User) -> None:
    user = _get_user_by_public_id(db, user_id)
    if user.id == actor.id:
        raise forbidden("You cannot delete your own account.")

    ticket_count = db.scalar(select(func.count()).select_from(Ticket).where(Ticket.operator_id == user.id)) or 0
    payment_count = db.scalar(select(func.count()).select_from(Payment).where(Payment.collected_by == user.id)) or 0
    if ticket_count or payment_count:
        raise AppError(
            "USER_HAS_HISTORY",
            "This user cannot be deleted because they have ticket or payment history. Deactivate the account instead.",
        )

    email = user.email
    write_audit_log(db, actor=actor, action="User Deleted", details=f"Permanently deleted user {email}")
    db.delete(user)
    db.commit()


def _get_user_by_public_id(db: Session, user_id: str) -> User:
    filters = [User.external_code == user_id]
    try:
        filters.append(User.id == uuid.UUID(user_id))
    except ValueError:
        pass

    user = db.scalar(
        select(User)
        .options(joinedload(User.role))
        .where(or_(*filters))
    )
    if not user:
        raise not_found("User")
    return user
