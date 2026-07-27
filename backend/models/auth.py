"""
Sen Trắng Hub — Authentication & User Pydantic Schemas
========================================================
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ─── AUTH REQUEST SCHEMAS ─────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., example="admin@sentranghub.vn")
    password: str = Field(..., min_length=6, example="SenTrang@2026!")


class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., example="thanhvien@sentranghub.vn")
    password: str = Field(..., min_length=6, example="MatKhau123!")
    display_name: str = Field(..., min_length=2, example="Nguyễn Văn A")
    phone_number: Optional[str] = Field(None, example="0901234567")
    role_id: Optional[str] = Field("role_thanh_vien", example="role_thanh_vien")


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None


# ─── RESPONSE SCHEMAS ─────────────────────────────────────────────

class PermissionResponse(BaseModel):
    id: str
    module: str
    action: str
    description: str
    group: str


class RoleResponse(BaseModel):
    id: str
    name: str
    description: str
    level: int
    color: str
    icon: str
    is_system: bool
    permissions: List[str] = []


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    phone_number: Optional[str] = None
    role_id: str
    role_name: Optional[str] = None
    role_level: Optional[int] = None
    member_id: Optional[str] = None
    is_active: bool
    permissions: List[str] = []
    last_login_at: Optional[datetime] = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class GenericResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[dict] = None
