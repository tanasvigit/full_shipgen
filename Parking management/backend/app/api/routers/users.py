from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, require_permissions
from app.schemas.user import UserCreateRequest, UserResponse, UserUpdateRequest
from app.services import users as users_service

router = APIRouter()
AdminUser = Annotated[object, Depends(require_permissions("users.manage"))]


@router.get("", response_model=list[UserResponse])
def get_users(db: DbSession, _: AdminUser, search: str | None = Query(default=None)) -> list[UserResponse]:
    return users_service.list_users(db, search)


@router.post("", response_model=UserResponse)
def create_user(payload: UserCreateRequest, db: DbSession, actor: AdminUser) -> UserResponse:
    return users_service.create_user(db, payload, actor)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, payload: UserUpdateRequest, db: DbSession, actor: AdminUser) -> UserResponse:
    return users_service.update_user(db, user_id, payload, actor)


@router.delete("/{user_id}")
def delete_user(user_id: str, db: DbSession, actor: AdminUser) -> dict[str, str]:
    users_service.delete_user(db, user_id, actor)
    return {"message": "User deleted"}
