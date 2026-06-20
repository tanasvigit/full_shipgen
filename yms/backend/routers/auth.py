from fastapi import APIRouter, Depends, HTTPException, Request
import os

from auth_rbac import (
    ALL_ROLES,
    AuthContext,
    Role,
    get_current_user,
    permissions_for_role,
    require_role,
)
from schemas import (
    AuthMeOut,
    ImpersonateIn,
    LoginIn,
    LogoutIn,
    RefreshIn,
    RolePermissionsOut,
    TokenOut,
)
from services.auth_service import (
    authenticate_platform_token,
    authenticate_user,
    create_access_token,
    create_refresh_token_value,
    get_user_by_id,
    revoke_refresh_token,
    store_refresh_token,
    validate_refresh_token,
)

router = APIRouter(tags=["auth"])

IMPERSONATABLE_ROLES = {
    Role.YARD_MANAGER.value,
    Role.GATE_OPERATOR.value,
    Role.YARD_COORDINATOR.value,
    Role.DOCK_SUPERVISOR.value,
}


@router.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn):
    user = await authenticate_user(body.identity, body.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    refresh = create_refresh_token_value()
    await store_refresh_token(user["user_id"], refresh)
    access = create_access_token(
        user_id=user["user_id"],
        username=user["username"],
        role=user["role"],
        permissions=user["permissions"],
    )
    return TokenOut(access_token=access, refresh_token=refresh)


@router.post("/auth/platform-login", response_model=TokenOut)
async def platform_login(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing platform session")
    platform_token = auth_header.split(" ", 1)[1].strip()
    if not platform_token:
        raise HTTPException(status_code=401, detail="Missing platform session")

    user = await authenticate_platform_token(platform_token)
    refresh = create_refresh_token_value()
    await store_refresh_token(user["user_id"], refresh)
    access = create_access_token(
        user_id=user["user_id"],
        username=user["username"],
        role=user["role"],
        permissions=user["permissions"],
    )
    return TokenOut(access_token=access, refresh_token=refresh)


@router.post("/auth/refresh", response_model=TokenOut)
async def refresh(body: RefreshIn):
    user = await validate_refresh_token(body.refresh_token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    await revoke_refresh_token(body.refresh_token)
    new_refresh = create_refresh_token_value()
    await store_refresh_token(user["user_id"], new_refresh)
    access = create_access_token(
        user_id=user["user_id"],
        username=user["username"],
        role=user["role"],
        permissions=user["permissions"],
    )
    return TokenOut(access_token=access, refresh_token=new_refresh)


@router.post("/auth/logout")
async def logout(body: LogoutIn):
    await revoke_refresh_token(body.refresh_token)
    return {"ok": True}


@router.get("/auth/me", response_model=AuthMeOut)
async def auth_me(ctx: AuthContext = Depends(get_current_user)):
    user = await get_user_by_id(ctx.user_id)
    display_name = user["display_name"] if user else ctx.username
    perms = sorted(ctx.permissions)
    return AuthMeOut(
        user_id=ctx.user_id,
        username=ctx.username,
        display_name=display_name,
        role=ctx.role,
        permissions=perms,
        impersonating=ctx.impersonating,
    )


@router.get("/auth/roles", response_model=list[str])
async def list_roles():
    return sorted(ALL_ROLES)


@router.get("/auth/permissions", response_model=RolePermissionsOut)
async def role_permissions(ctx: AuthContext = Depends(get_current_user)):
    perms = sorted(ctx.permissions)
    return RolePermissionsOut(role=ctx.role, permissions=perms)


@router.post("/auth/impersonate", response_model=TokenOut)
async def impersonate(
    body: ImpersonateIn,
    ctx: AuthContext = Depends(require_role(Role.YARD_ADMIN.value)),
):
    if os.environ.get("NODE_ENV", "").lower() == "production" or os.environ.get("ENABLE_DEV_ROLE_OVERRIDE", "false").lower() not in ("1", "true", "yes"):
        raise HTTPException(status_code=403, detail="Impersonation is disabled")
    role = body.role.strip().lower()
    if role not in IMPERSONATABLE_ROLES:
        raise HTTPException(status_code=400, detail=f"Cannot impersonate role: {role}")
    perms = sorted(permissions_for_role(role))
    access = create_access_token(
        user_id=ctx.user_id,
        username=ctx.username,
        role=role,
        permissions=perms,
        impersonating=True,
    )
    refresh = create_refresh_token_value()
    await store_refresh_token(ctx.user_id, refresh)
    return TokenOut(access_token=access, refresh_token=refresh)
