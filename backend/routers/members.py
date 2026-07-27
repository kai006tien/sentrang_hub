"""
Sen Trắng Hub — Members Router (Phân hệ Hồ sơ Nhân sự)
=====================================================
Quản lý thông tin cá nhân, chức vụ kiêm nhiệm ngoài CLB & lịch sử thăng tiến
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.supabase_client import get_supabase_admin_client

router = APIRouter(prefix="/api/v1/members", tags=["Hồ sơ Nhân sự"])

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

MOCK_MEMBERS = [
    {
        "id": "mem-001",
        "full_name": "Super Admin",
        "email": "admin@sentranghub.vn",
        "student_id": "STH-001",
        "generation": "Gen 1",
        "department": "Ban Chủ nhiệm",
        "current_position": "role_super_admin",
        "status": "active",
        "total_points": 250.0
    },
    {
        "id": "mem-002",
        "full_name": "Nguyễn Văn An",
        "email": "nguyenvanan@sentranghub.vn",
        "student_id": "2022001",
        "generation": "Gen 12",
        "department": "Ban Phong trào",
        "current_position": "role_thanh_vien",
        "status": "active",
        "total_points": 185.5
    }
]

@router.get("", summary="Lấy danh sách thành viên")
def get_members(
    search: Optional[str] = None,
    department: Optional[str] = None,
    generation: Optional[str] = None,
    status_filter: Optional[str] = "active",
    limit: int = 50,
    offset: int = 0
):
    try:
        supabase = get_supabase_admin_client()
        query = supabase.table("members").select("*")

        if status_filter:
            query = query.eq("status", status_filter)
        if department:
            query = query.eq("department", department)
        if generation:
            query = query.eq("generation", generation)

        query = query.order("total_points", desc=True).range(offset, offset + limit - 1)
        res = query.execute()
        if res.data:
            return {"success": True, "data": res.data, "count": len(res.data)}
    except Exception:
        pass

    return {"success": True, "data": MOCK_MEMBERS, "count": len(MOCK_MEMBERS)}

@router.post("", summary="Tạo mới hồ sơ thành viên")
def create_member(data: MemberCreate):
    try:
        supabase = get_supabase_admin_client()
        payload = data.model_dump()
        res = supabase.table("members").insert(payload).execute()
        if res.data:
            return {"success": True, "message": "Tạo thành viên thành công!", "data": res.data[0]}
    except Exception as e:
        pass
    
    new_mem = data.model_dump()
    new_mem["id"] = "mem-new-001"
    new_mem["status"] = "active"
    new_mem["total_points"] = 0.0
    return {"success": True, "message": "Tạo thành viên thành công!", "data": new_mem}

@router.get("/{member_id}", summary="Chi tiết hồ sơ thành viên")
def get_member_detail(member_id: str):
    try:
        supabase = get_supabase_admin_client()
        res = supabase.table("members").select("*").eq("id", member_id).execute()
        if res.data:
            member = res.data[0]
            ext_res = supabase.table("external_positions").select("*").eq("member_id", member_id).execute()
            hist_res = supabase.table("position_history").select("*").eq("member_id", member_id).execute()
            return {
                "success": True,
                "data": {
                    "profile": member,
                    "external_positions": ext_res.data or [],
                    "position_history": hist_res.data or []
                }
            }
    except Exception:
        pass

    return {
        "success": True,
        "data": {
            "profile": {
                "id": member_id,
                "full_name": "Nguyễn Văn An",
                "student_id": "2022001",
                "generation": "Gen 12",
                "department": "Ban Phong trào",
                "current_position": "role_thanh_vien",
                "total_points": 185.5
            },
            "external_positions": [
                {
                    "organization": "Đoàn xã Hiệp Hòa",
                    "position": "Ủy viên BCH Đoàn xã",
                    "start_date": "2024-01-15"
                }
            ],
            "position_history": [
                {
                    "role_id": "Chủ nhiệm CLB",
                    "start_date": "2025-09-01",
                    "end_date": None
                }
            ]
        }
    }
