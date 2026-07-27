"""
Sen Trắng Hub — Notifications Router (Hệ thống Thông báo Push Alert)
====================================================================
Gửi thông báo tức thời đến từng nhóm user / role
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.supabase_client import get_supabase_admin_client

router = APIRouter(prefix="/api/v1/notifications", tags=["Hệ thống Thông báo"])

class NotificationCreate(BaseModel):
    title: str
    content: str
    type: Optional[str] = "alert"
    target_role: Optional[str] = "all"
    created_by: Optional[str] = "Super Admin"

# Mock/In-memory Notification Store if table not seeded
NOTIFICATIONS_DB = [
    {
        "id": "notif-001",
        "title": "Chào mừng đến với Sen Trắng Hub v1.0",
        "content": "Hệ thống Quản trị Nội bộ chính thức đi vào hoạt động với đầy đủ 6 phân hệ.",
        "type": "announcement",
        "target_role": "all",
        "created_by": "Super Admin",
        "created_at": "2026-07-27T22:00:00Z"
    },
    {
        "id": "notif-002",
        "title": "Nhắc nhở: Điểm danh Chiến dịch Hè Tình nguyện 2026",
        "content": "Vui lòng quét mã QR tại bàn điểm danh trước 07:30 sáng mai.",
        "type": "event",
        "target_role": "all",
        "created_by": "Ban Phong trào",
        "created_at": "2026-07-27T21:30:00Z"
    }
]

@router.get("", summary="Lấy danh sách thông báo")
def get_notifications(target_role: Optional[str] = "all"):
    return {"success": True, "data": NOTIFICATIONS_DB, "count": len(NOTIFICATIONS_DB)}

@router.post("", summary="Phát thông báo tức thời")
def create_notification(data: NotificationCreate):
    import uuid, datetime
    new_notif = data.model_dump()
    new_notif["id"] = f"notif-{uuid.uuid4().hex[:6]}"
    new_notif["created_at"] = datetime.datetime.utcnow().isoformat() + "Z"
    NOTIFICATIONS_DB.insert(0, new_notif)
    return {"success": True, "message": "Đã phát thông báo tức thời!", "data": new_notif}
