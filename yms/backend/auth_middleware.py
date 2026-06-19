"""API module-access middleware for JWT-authenticated requests."""

from __future__ import annotations

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from auth_rbac import check_route_module_access, get_current_user

_UNGUARDED = {
    "/api/",
    "/api/auth/login",
    "/api/auth/platform-login",
    "/api/auth/logout",
    "/api/auth/refresh",
}


class ModuleAccessMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        if request.method == "OPTIONS" or path in _UNGUARDED:
            return await call_next(request)
        if not path.startswith("/api/"):
            return await call_next(request)
        if path.startswith("/api/auth/login") or path.startswith("/api/auth/platform-login") or path.startswith("/api/auth/refresh") or path.startswith("/api/auth/logout"):
            return await call_next(request)

        try:
            auth_header = request.headers.get("Authorization", "")
            credentials = None
            if auth_header.lower().startswith("bearer "):
                credentials = HTTPAuthorizationCredentials(
                    scheme="Bearer",
                    credentials=auth_header.split(" ", 1)[1],
                )
            ctx = await get_current_user(
                credentials=credentials,
                x_yms_role=request.headers.get("X-YMS-Role"),
                x_yms_user=request.headers.get("X-YMS-User"),
            )
            check_route_module_access(path, ctx)
        except HTTPException as exc:
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

        return await call_next(request)
