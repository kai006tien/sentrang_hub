"""
Sen Trắng Hub — Authentication API Router
==========================================
Endpoints:
- POST /api/auth/login
- POST /api/auth/register
- GET  /api/auth/me
- POST /api/auth/change-password
"""

from fastapi import APIRouter, Depends, HTTPException, status
from backend.models.auth import (
    LoginRequest, RegisterRequest, ChangePasswordRequest,
    TokenResponse, UserResponse, GenericResponse
)
from backend.services.auth_service import AuthService
from backend.services.supabase_client import get_supabase_admin
from backend.dependencies import get_current_user


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, summary="Đăng nhập tài khoản")
def login(req: LoginRequest):
    """
    Đăng nhập bằng Email và Password.
    Trả về JWT Access Token, Refresh Token và thông tin User kèm danh sách Permission Keys.
    """
    return AuthService.login(req)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Đăng ký tài khoản mới")
def register(req: RegisterRequest):
    """
    Đăng ký tài khoản thành viên mới trong hệ thống.
    Mặc định gán vai trò 'role_thanh_vien'.
    """
    return AuthService.register(req)


@router.get("/me", response_model=UserResponse, summary="Lấy thông tin tài khoản hiện tại")
def get_me(current_user: UserResponse = Depends(get_current_user)):
    """
    Lấy thông tin chi tiết tài khoản đang đăng nhập kèm Vai trò và danh sách Quyền hạn.
    Yêu cầu: Bearer Token trong Header.
    """
    return current_user


@router.post("/change-password", response_model=GenericResponse, summary="Đổi mật khẩu")
def change_password(
    req: ChangePasswordRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Đổi mật khẩu tài khoản hiện tại.
    """
    supabase = get_supabase_admin()
    
    try:
        # Cập nhật mật khẩu qua Supabase Auth Admin API
        supabase.auth.admin.update_user_by_id(
            current_user.id,
            {"password": req.new_password}
        )
        return GenericResponse(
            success=True,
            message="Đổi mật khẩu thành công. Vui lòng đăng nhập lại."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Đổi mật khẩu thất bại: {str(e)}"
        )
