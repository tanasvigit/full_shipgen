from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class UserResponse(ORMModel):
    id: str
    name: str
    email: EmailStr
    role: str
    status: str
    createdAt: str


class UserCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6)
    role: str
    status: str = "active"


class UserUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6)
    role: str | None = None
    status: str | None = None
