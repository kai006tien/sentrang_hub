"""
Sen Trắng Hub — Security & Authentication Dependencies
======================================================
Cung cấp các dependency injection cho FastAPI routes:
- get_current_user: Xác thực user từ Authorization Header
- require_permission(perm): Kiểm tra permission key
- require_role_level(level): Kiểm tra cấp bậc vai trò
"""

from typing import Callable, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.models.auth import UserResponse
from backend.services.auth_service import AuthService


security_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> UserResponse:
    """Dependency lấy thông tin user hiện tại từ Bearer Token."""
    token = credentials.credentials
    user = AuthService.verify_token(token)
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn đang bị khóa."
        )
    return user


def require_permission(permission_key: str) -> Callable:
    """Dependency factory kiểm tra user có quyền cụ thể."""
    def permission_checker(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
        # Super Admin (level 0) có tất cả quyền
        if current_user.role_level == 0:
            return current_user

        if permission_key not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bạn không có quyền thực hiện thao tác này (Cần quyền: '{permission_key}')."
            )
        return current_user

    return permission_checker


def require_role_level(max_level: int) -> Callable:
    """Dependency factory kiểm tra user có cấp bậc level <= max_level."""
    def level_checker(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
        user_level = current_user.role_level if current_user.role_level is not None else 99
        if user_level > max_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Thao tác này yêu cầu cấp bậc vai trò tối thiểu (Level <= {max_level})."
            )
        return current_user

    return level_checker
