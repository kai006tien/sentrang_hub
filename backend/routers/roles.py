"""
Sen Trắng Hub — Roles & Permissions API Router
===============================================
Endpoints:
- GET /api/roles
- GET /api/roles/{role_id}
- PUT /api/roles/{role_id}/permissions
- GET /api/permissions
"""

from typing import List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from backend.models.auth import RoleResponse, PermissionResponse, UserResponse, GenericResponse
from backend.services.supabase_client import get_supabase_admin
from backend.dependencies import get_current_user, require_permission, require_role_level


router = APIRouter(prefix="/api/roles", tags=["Roles & Permissions"])


class AssignPermissionsRequest(BaseModel):
    permissions: List[str] = Field(..., description="Danh sách permission_ids mới")


@router.get("", response_model=List[RoleResponse], summary="Danh sách vai trò")
def list_roles(current_user: UserResponse = Depends(get_current_user)):
    """
    Lấy toàn bộ danh sách Vai trò (Roles) trong hệ thống kèm theo danh sách Quyền hạn của từng vai trò.
    """
    supabase = get_supabase_admin()
    roles_res = supabase.table("roles").select("*").order("level", desc=False).execute()
    
    result = []
    for r in roles_res.data:
        role_id = r["id"]
        perm_res = supabase.table("role_permissions").select("permission_id").eq("role_id", role_id).execute()
        perms = [p["permission_id"] for p in perm_res.data] if perm_res.data else []
        
        result.append(RoleResponse(
            id=role_id,
            name=r["name"],
            description=r.get("description", ""),
            level=r["level"],
            color=r.get("color", "#95A5A6"),
            icon=r.get("icon", "user"),
            is_system=r.get("is_system", False),
            permissions=perms
        ))

    return result


@router.get("/permissions/all", response_model=List[PermissionResponse], summary="Registry danh sách quyền hạn")
def list_all_permissions(current_user: UserResponse = Depends(get_current_user)):
    """
    Lấy danh sách tất cả Permission Keys có trong hệ thống (phân nhóm theo module).
    """
    supabase = get_supabase_admin()
    res = supabase.table("permissions").select("*").order("module").execute()
    return res.data


@router.get("/{role_id}", response_model=RoleResponse, summary="Chi tiết vai trò")
def get_role(role_id: str, current_user: UserResponse = Depends(get_current_user)):
    """
    Xem chi tiết 1 Vai trò kèm các quyền hạn được gán.
    """
    supabase = get_supabase_admin()
    r_res = supabase.table("roles").select("*").eq("id", role_id).execute()
    if not r_res.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy vai trò.")
    
    r = r_res.data[0]
    perm_res = supabase.table("role_permissions").select("permission_id").eq("role_id", role_id).execute()
    perms = [p["permission_id"] for p in perm_res.data] if perm_res.data else []

    return RoleResponse(
        id=role_id,
        name=r["name"],
        description=r.get("description", ""),
        level=r["level"],
        color=r.get("color", "#95A5A6"),
        icon=r.get("icon", "user"),
        is_system=r.get("is_system", False),
        permissions=perms
    )


@router.put("/{role_id}/permissions", response_model=RoleResponse, summary="Cập nhật quyền cho vai trò")
def update_role_permissions(
    role_id: str,
    req: AssignPermissionsRequest,
    current_user: UserResponse = Depends(require_permission("roles.manage"))
):
    """
    Cập nhật lại cây phân quyền cho 1 vai trò (Dynamic Role-Permission mapping).
    Yêu cầu quyền: `roles.manage`.
    """
    supabase = get_supabase_admin()

    # Kiểm tra xem role có tồn tại không
    r_res = supabase.table("roles").select("*").eq("id", role_id).execute()
    if not r_res.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy vai trò.")

    # Không cho sửa role Super Admin từ API thường ngoại trừ level 0
    if role_id == "role_super_admin" and current_user.role_level != 0:
        raise HTTPException(status_code=403, detail="Chỉ Super Admin gốc mới được sửa quyền Super Admin.")

    # Xóa toàn bộ mapping cũ
    supabase.table("role_permissions").delete().eq("role_id", role_id).execute()

    # Thêm mapping mới
    if req.permissions:
        new_mappings = [{"role_id": role_id, "permission_id": p} for p in req.permissions]
        supabase.table("role_permissions").insert(new_mappings).execute()

    # Ghi activity log
    try:
        supabase.table("activity_logs").insert({
            "user_id": current_user.id,
            "user_name": current_user.display_name,
            "action": "role.permissions_update",
            "module": "roles",
            "target_id": role_id,
            "target_type": "role",
            "description": f"Cập nhật cây phân quyền cho vai trò '{role_id}' ({len(req.permissions)} quyền mới)"
        }).execute()
    except Exception:
        pass

    return get_role(role_id, current_user)
