"""
Sen Trắng Hub — System Activity Logs Router (Audit Trail)
=========================================================
Quản lý nhật ký hoạt động của các quản trị viên
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from backend.services.supabase_client import get_supabase_admin_client

router = APIRouter(prefix="/api/v1/logs", tags=["System Activity Logs"])

class LogCreate(BaseModel):
    user_name: str
    action: str
    module: str
    target_id: Optional[str] = None
    target_type: Optional[str] = None
    description: Optional[str] = ""
    metadata: Optional[dict] = {}

@router.get("", summary="Lấy danh sách nhật ký hoạt động")
def get_activity_logs(
    module: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    supabase = get_supabase_admin_client()
    query = supabase.table("activity_logs").select("*")

    if module:
        query = query.eq("module", module)
    if action:
        query = query.eq("action", action)

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    res = query.execute()
    return {"success": True, "data": res.data, "count": len(res.data)}

@router.post("", summary="Ghi mới một audit log")
def create_log(data: LogCreate):
    supabase = get_supabase_admin_client()
    res = supabase.table("activity_logs").insert(data.model_dump()).execute()
    return {"success": True, "data": res.data[0] if res.data else None}
