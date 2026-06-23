from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import unauthorized
from app.core.security import create_access_token, verify_password
from app.models.auth import Role
from app.models.user import User


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.scalar(
        select(User)
        .options(joinedload(User.role).joinedload(Role.permissions))
        .where(User.email == email.lower())
    )
    if not user or user.status != "active" or not verify_password(password, user.password_hash):
        raise unauthorized()
    return user


def issue_token_for_user(user: User) -> str:
    return create_access_token(str(user.id), {"role": user.role.name})
