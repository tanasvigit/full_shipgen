from fastapi import APIRouter, Header

from app.api.deps import CurrentUser, DbSession
from app.schemas.auth import LoginRequest, MeResponse, TokenResponse
from app.services.audit import write_audit_log
from app.services.auth import authenticate_user, issue_token_for_user
from app.services.platform_auth import authenticate_platform_token
from app.utils.serializers import serialize_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    user = authenticate_user(db, payload.email, payload.password)
    token = issue_token_for_user(user)
    write_audit_log(db, actor=user, action="User Login", details=f"{user.email} logged in")
    db.commit()
    return TokenResponse(access_token=token)


@router.post("/platform-login", response_model=TokenResponse)
def platform_login(
    db: DbSession,
    authorization: str | None = Header(default=None),
) -> TokenResponse:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise unauthorized_platform_session()
    platform_token = authorization.split(" ", 1)[1].strip()
    if not platform_token:
        raise unauthorized_platform_session()
    user = authenticate_platform_token(db, platform_token)
    token = issue_token_for_user(user)
    write_audit_log(
        db,
        actor=user,
        action="Platform SSO Login",
        details=f"{user.email} signed in via Shipgen",
    )
    db.commit()
    return TokenResponse(access_token=token)


def unauthorized_platform_session():
    from fastapi import HTTPException

    raise HTTPException(status_code=401, detail="Missing platform session")


@router.post("/logout")
def logout(current_user: CurrentUser, db: DbSession) -> dict[str, str]:
    write_audit_log(db, actor=current_user, action="User Logout", details=f"{current_user.email} logged out")
    db.commit()
    return {"message": "Logged out. Discard the token on the client."}


@router.get("/me", response_model=MeResponse)
def me(current_user: CurrentUser) -> MeResponse:
    data = serialize_user(current_user)
    data["permissions"] = sorted({permission.code for permission in current_user.role.permissions})
    return MeResponse(**data)
