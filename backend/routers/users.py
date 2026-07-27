"""
Sen Trắng Hub — User Management API Router
===========================================
Endpoints:
- GET    /api/users
- GET    /api/users/{user_id}
- POST   /api/users
- PUT    /api/users/{user_id}
- DELETE /api/users/{user_id}
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from backend.models.auth import UserResponse, RegisterRequest, UpdateProfileRequest, GenericResponse
from backend.services.auth_service import AuthService
from backend.services.supabase_client import get_supabase_admin
from backend.dependencies import get_current_user, require_permission, require_role_level


router = APIRouter(prefix="/api/users", tags=["Users Management"])


@router.get("", response_model=List[UserResponse], summary="Danh sách người dùng")
def list_users(
    role_id: Optional[str] = Query(None, description="Lọc theo vai trò"),
    is_active: Optional[bool] = Query(None, description="Lọc theo trạng thái active"),
    search: Optional[str] = Query(None, description="Tìm theo email hoặc tên"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: UserResponse = Depends(require_permission("users.read"))
):
    """
    Lấy danh sách người dùng trong hệ thống (Có phân trang và bộ lọc).
    Yêu cầu quyền: `users.read`.
    """
    supabase = get_supabase_admin()
    query = supabase.table("users").select("*")

    if role_id:
        query = query.eq("role_id", role_id)
    if is_active is not None:
        query = query.eq("is_active", is_active)
    if search:
        query = query.or_(f"email.ilike.%{search}%,display_name.ilike.%{search}%")

    query = query.range(offset, offset + limit - 1).order("created_at", desc=True)
    res = query.execute()

    users = []
    for item in res.data:
        try:
            u = AuthService.get_user_with_role(str(item["id"]))
            users.append(u)
        except Exception:
            continue

    return users


@router.get("/{user_id}", response_model=UserResponse, summary="Chi tiết người dùng")
def get_user(
    user_id: str,
    current_user: UserResponse = Depends(require_permission("users.read"))
):
    """
    Xem chi tiết 1 tài khoản người dùng.
    Yêu cầu quyền: `users.read`.
    """
    return AuthService.get_user_with_role(user_id)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Tạo người dùng mới (Admin)")
def create_user(
    req: RegisterRequest,
    current_user: UserResponse = Depends(require_permission("users.create"))
):
    """
    Admin tạo tài khoản người dùng mới và phân quyền vai trò.
    Yêu cầu quyền: `users.create`.
    """
    return AuthService.register(req, created_by_uid=current_user.id)


@router.put("/{user_id}", response_model=UserResponse, summary="Cập nhật người dùng")
def update_user(
    user_id: str,
    req: UpdateProfileRequest,
    role_id: Optional[str] = Query(None, description="Thay đổi vai trò (cần quyền users.update)"),
    is_active: Optional[bool] = Query(None, description="Khóa/Mở tài khoản"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Cập nhật thông tin tài khoản.
    - User có thể tự cập nhật `display_name`, `phone_number`, `avatar_url` của mình.
    - Thay đổi `role_id` hoặc `is_active` cần quyền `users.update`.
    """
    supabase = get_supabase_admin()
    
    # Kiểm tra quyền
    is_self = current_user.id == user_id
    has_update_perm = "users.update" in current_user.permissions or current_user.role_level == 0

    if not is_self and not has_update_perm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền sửa thông tin của người dùng khác."
        )

    payload = {}
    if req.display_name is not None:
        payload["display_name"] = req.display_name
    if req.phone_number is not None:
        payload["phone_number"] = req.phone_number
    if req.avatar_url is not None:
        payload["avatar_url"] = req.avatar_url

    if has_update_perm:
        if role_id is not None:
            payload["role_id"] = role_id
        if is_active is not None:
            payload["is_active"] = is_active

    if not payload:
        return AuthService.get_user_with_role(user_id)

    supabase.table("users").update(payload).eq("id", user_id).execute()
    return AuthService.get_user_with_role(user_id)


@router.delete("/{user_id}", response_model=GenericResponse, summary="Xóa tài khoản")
def delete_user(
    user_id: str,
    current_user: UserResponse = Depends(require_permission("users.delete"))
):
    """
    Xóa vĩnh viễn tài khoản người dùng khỏi hệ thống.
    Yêu cầu quyền: `users.delete` (Super Admin).
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể tự xóa tài khoản của chính mình."
        )

    supabase = get_supabase_admin()
    
    try:
        # Xóa khỏi Supabase Auth
        supabase.auth.admin.delete_user(user_id)
        # Xóa khỏi public.users (nếu ON DELETE CASCADE chưa xóa)
        supabase.table("users").delete().eq("id", user_id).execute()

        return GenericResponse(
            success=True,
            message=f"Đã xóa tài khoản ID '{user_id}' thành công."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Xóa tài khoản thất bại: {str(e)}"
        )
