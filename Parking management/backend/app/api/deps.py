from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.exceptions import forbidden, unauthorized
from app.core.security import get_token_subject
from app.models.auth import Role
from app.models.user import User

security = HTTPBearer(auto_error=False)
DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> User:
    if credentials is None:
        raise unauthorized("Missing bearer token.")
    try:
        user_id = get_token_subject(credentials.credentials)
    except JWTError as exc:
        raise unauthorized("Invalid or expired token.") from exc
    user = db.scalar(
        select(User).options(joinedload(User.role).joinedload(Role.permissions)).where(User.id == user_id)
    )
    if not user or user.status != "active":
        raise unauthorized("User is inactive or not found.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def user_permissions(user: User) -> set[str]:
    return {permission.code for permission in user.role.permissions}


def require_permissions(*permissions: str) -> Callable[[User], User]:
    def dependency(user: CurrentUser) -> User:
        if not set(permissions) & user_permissions(user):
            raise forbidden("You do not have permission to perform this action.")
        return user

    return dependency


def require_roles(*roles: str) -> Callable[[User], User]:
    def dependency(user: CurrentUser) -> User:
        if user.role.name not in roles:
            raise forbidden("This route is not available for your role.")
        return user

    return dependency
