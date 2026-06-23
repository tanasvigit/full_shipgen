from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(ORMModel):
    id: str
    name: str
    email: EmailStr
    role: str
    status: str
    createdAt: str
    permissions: list[str]
