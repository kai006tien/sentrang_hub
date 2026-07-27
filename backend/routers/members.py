"""
Sen Trắng Hub — Members Router (Phân hệ Hồ sơ Nhân sự)
=====================================================
Quản lý thông tin cá nhân, chức vụ kiêm nhiệm ngoài CLB & lịch sử thăng tiến
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status
from pydantic import BaseModel, EmailStr
from backend.services.supabase_client import get_supabase_admin_client

router = APIRouter(prefix="/api/v1/members", tags=["Hồ sơ Nhân sự"])

# ─── PYDANTIC SCHEMAS ──────────────────────────────────────────────
class MemberCreate(BaseModel):
    full_name: str
    email: str
    phone_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = "other"
    student_id: Optional[str] = None
    university: Optional[str] = "Đại học"
    faculty: Optional[str] = None
    major: Optional[str] = None
    class_code: Optional[str] = None
    generation: Optional[str] = "Gen 1"
    department: Optional[str] = "Ban Phong trào"
    current_position: Optional[str] = "role_thanh_vien"
    address: Optional[str] = None

class ExternalPositionCreate(BaseModel):
    member_id: str
    organization: str
    position: str
    start_date: str
    end_date: Optional[str] = None
    is_active: Optional[bool] = True

class PositionHistoryCreate(BaseModel):
    member_id: str
    role_id: str
    department: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    note: Optional[str] = ""

# ─── ENDPOINTS ─────────────────────────────────────────────────────

@router.get("", summary="Lấy danh sách thành viên")
def get_members(
    search: Optional[str] = None,
    department: Optional[str] = None,
    generation: Optional[str] = None,
    status_filter: Optional[str] = "active",
    limit: int = 50,
    offset: int = 0
):
    supabase = get_supabase_admin_client()
    query = supabase.table("members").select("*")

    if status_filter:
        query = query.eq("status", status_filter)
    if department:
        query = query.eq("department", department)
    if generation:
        query = query.eq("generation", generation)
    if search:
        query = query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%,student_id.ilike.%{search}%")

    query = query.order("total_points", desc=True).range(offset, offset + limit - 1)
    res = query.execute()
    return {"success": True, "data": res.data, "count": len(res.data)}

@router.post("", summary="Tạo mới hồ sơ thành viên")
def create_member(data: MemberCreate):
    supabase = get_supabase_admin_client()
    payload = data.model_dump()
    res = supabase.table("members").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Không thể tạo thành viên.")
    return {"success": True, "message": "Tạo thành viên thành công!", "data": res.data[0]}

@router.get("/{member_id}", summary="Chi tiết hồ sơ thành viên")
def get_member_detail(member_id: str):
    supabase = get_supabase_admin_client()
    
    # 1. Member Profile
    res = supabase.table("members").select("*").eq("id", member_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy thành viên.")
    member = res.data[0]

    # 2. External Positions (Chức vụ kiêm nhiệm)
    ext_res = supabase.table("external_positions").select("*").eq("member_id", member_id).order("start_date", desc=True).execute()

    # 3. Position History (Lịch sử thăng tiến)
    hist_res = supabase.table("position_history").select("*").eq("member_id", member_id).order("start_date", desc=True).execute()

    return {
        "success": True,
        "data": {
            "profile": member,
            "external_positions": ext_res.data,
            "position_history": hist_res.data
        }
    }

@router.post("/external-positions", summary="Thêm chức vụ kiêm nhiệm ngoài CLB")
def add_external_position(data: ExternalPositionCreate):
    supabase = get_supabase_admin_client()
    res = supabase.table("external_positions").insert(data.model_dump()).execute()
    return {"success": True, "message": "Thêm chức vụ kiêm nhiệm thành công!", "data": res.data[0]}

@router.post("/position-history", summary="Ghi nhận mốc lịch sử thăng tiến")
def add_position_history(data: PositionHistoryCreate):
    supabase = get_supabase_admin_client()
    res = supabase.table("position_history").insert(data.model_dump()).execute()
    return {"success": True, "message": "Ghi nhận mốc thăng tiến thành công!", "data": res.data[0]}
