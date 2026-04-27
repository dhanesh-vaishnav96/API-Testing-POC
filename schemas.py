from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth Schemas ----------

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["John Doe"])
    email: str = Field(..., min_length=5, max_length=255, examples=["john@example.com"])
    password: str = Field(..., min_length=6, max_length=128, examples=["secret123"])


class LoginRequest(BaseModel):
    email: str = Field(..., examples=["john@example.com"])
    password: str = Field(..., examples=["secret123"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- User Schemas ----------

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Jane Doe"])
    email: str = Field(..., min_length=5, max_length=255, examples=["jane@example.com"])
    password: str = Field(..., min_length=6, max_length=128, examples=["secret456"])


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, min_length=5, max_length=255)
    password: Optional[str] = Field(None, min_length=6, max_length=128)


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    message: str
    id: Optional[int] = None
