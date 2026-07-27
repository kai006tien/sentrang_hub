"""
Sen Trắng Hub — Events & Attendance API Router
===============================================
Endpoints:
- GET    /api/events
- POST   /api/events
- GET    /api/events/{event_id}
- PUT    /api/events/{event_id}
- DELETE /api/events/{event_id}
- POST   /api/events/{event_id}/register
- POST   /api/events/check-in
- GET    /api/events/{event_id}/attendance
"""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from backend.models.auth import UserResponse, GenericResponse
from backend.models.modules import (
    EventCreateRequest, EventResponse, CheckInRequest
)
from backend.services.supabase_client import get_supabase_admin
from backend.dependencies import get_current_user, require_permission


router = APIRouter(prefix="/api/events", tags=["Events & Attendance"])


@router.get("", response_model=List[EventResponse], summary="Danh sách sự kiện")
def list_events(
    category: Optional[str] = Query(None, description="Lọc theo danh mục"),
    status_val: Optional[str] = Query(None, alias="status", description="draft | active | completed"),
    limit: int = 50,
    offset: int = 0
):
    """Lấy danh sách sự kiện trong hệ thống."""
    supabase = get_supabase_admin()
    query = supabase.table("events").select("*")

    if category:
        query = query.eq("category", category)
    if status_val:
        query = query.eq("status", status_val)

    res = query.order("start_date", desc=True).range(offset, offset + limit - 1).execute()
    
    events = []
    for item in res.data:
        events.append(EventResponse(
            id=str(item["id"]),
            title=item["title"],
            slug=item["slug"],
            description=item.get("description", ""),
            category=item.get("category", "volunteer"),
            cover_image_url=item.get("cover_image_url"),
            location=item.get("location", ""),
            location_lat=item.get("location_lat"),
            location_lng=item.get("location_lng"),
            start_date=item["start_date"],
            end_date=item.get("end_date"),
            max_participants=item.get("max_participants", 50),
            current_count=item.get("current_count", 0),
            is_registration_open=item.get("is_registration_open", True),
            requires_approval=item.get("requires_approval", True),
            base_points=float(item.get("base_points", 10.0)),
            status=item.get("status", "active"),
            visibility=item.get("visibility", "public"),
            created_at=item.get("created_at") or datetime.utcnow()
        ))
    return events


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED, summary="Tạo sự kiện mới")
def create_event(
    req: EventCreateRequest,
    current_user: UserResponse = Depends(require_permission("events.create"))
):
    """Tạo sự kiện mới kèm cấu hình form đăng ký và tích điểm rèn luyện."""
    supabase = get_supabase_admin()

    slug = req.slug or req.title.lower().replace(" ", "-").replace("/", "-")
    # Đảm bảo slug duy nhất
    existing = supabase.table("events").select("id").eq("slug", slug).execute()
    if existing.data:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    event_payload = {
        "title": req.title,
        "slug": slug,
        "description": req.description,
        "category": req.category,
        "cover_image_url": req.cover_image_url,
        "location": req.location,
        "location_lat": req.location_lat,
        "location_lng": req.location_lng,
        "start_date": req.start_date.isoformat(),
        "end_date": req.end_date.isoformat() if req.end_date else None,
        "registration_open": req.registration_open.isoformat() if req.registration_open else None,
        "registration_close": req.registration_close.isoformat() if req.registration_close else None,
        "max_participants": req.max_participants,
        "requires_approval": req.requires_approval,
        "form_fields": [f.model_dump() for f in req.form_fields] if req.form_fields else [],
        "base_points": req.base_points,
        "bonus_points": req.bonus_points,
        "status": "active",
        "visibility": req.visibility,
        "created_by": current_user.id
    }

    res = supabase.table("events").insert(event_payload).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Không thể tạo sự kiện.")

    item = res.data[0]
    
    # Tạo 1 session điểm danh mặc định
    try:
        supabase.table("event_sessions").insert({
            "event_id": item["id"],
            "name": "Phiên chính",
            "date": req.start_date.strftime("%Y-%m-%d"),
            "start_time": req.start_date.strftime("%H:%M:%S"),
            "end_time": (req.end_date or req.start_date).strftime("%H:%M:%S")
        }).execute()
    except Exception:
        pass

    return EventResponse(
        id=str(item["id"]),
        title=item["title"],
        slug=item["slug"],
        description=item.get("description", ""),
        category=item.get("category", "volunteer"),
        cover_image_url=item.get("cover_image_url"),
        location=item.get("location", ""),
        location_lat=item.get("location_lat"),
        location_lng=item.get("location_lng"),
        start_date=item["start_date"],
        end_date=item.get("end_date"),
        max_participants=item.get("max_participants", 50),
        current_count=0,
        is_registration_open=True,
        requires_approval=item.get("requires_approval", True),
        base_points=float(item.get("base_points", 10.0)),
        status=item.get("status", "active"),
        visibility=item.get("visibility", "public"),
        created_at=item.get("created_at") or datetime.utcnow()
    )


@router.get("/{event_id}", summary="Chi tiết sự kiện")
def get_event(event_id: str):
    """Lấy thông tin chi tiết 1 sự kiện kèm theo danh sách Sessions điểm danh."""
    supabase = get_supabase_admin()
    res = supabase.table("events").select("*").eq("id", event_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy sự kiện.")
    
    event_data = res.data[0]
    sessions_res = supabase.table("event_sessions").select("*").eq("event_id", event_id).execute()
    event_data["sessions"] = sessions_res.data or []
    return event_data


@router.post("/{event_id}/register", response_model=GenericResponse, summary="Đăng ký tham gia sự kiện")
def register_event(
    event_id: str,
    form_data: dict = {},
    current_user: UserResponse = Depends(get_current_user)
):
    """Thành viên đăng ký tham gia sự kiện."""
    supabase = get_supabase_admin()
    
    # Kiểm tra sự kiện
    event_res = supabase.table("events").select("*").eq("id", event_id).execute()
    if not event_res.data:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại.")
    
    event = event_res.data[0]
    if not event.get("is_registration_open", True):
        raise HTTPException(status_code=400, detail="Cổng đăng ký sự kiện đã đóng.")

    # Lấy member_id
    member_id = current_user.member_id or current_user.id

    reg_payload = {
        "event_id": event_id,
        "member_id": member_id,
        "member_name": current_user.display_name,
        "status": "pending" if event.get("requires_approval", True) else "approved",
        "form_data": form_data
    }

    try:
        supabase.table("registrations").upsert(reg_payload).execute()
        msg = "Đăng ký tham gia thành công. Đang chờ duyệt!" if event.get("requires_approval", True) else "Đăng ký thành công!"
        return GenericResponse(success=True, message=msg)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Đăng ký thất bại: {str(e)}")


@router.post("/check-in", response_model=GenericResponse, summary="Điểm danh sự kiện (QR Code/GPS)")
def process_check_in(
    req: CheckInRequest,
    current_user: UserResponse = Depends(require_permission("attendance.manage"))
):
    """Điểm danh thành viên tham gia sự kiện bằng QR Code hoặc Thủ công."""
    supabase = get_supabase_admin()

    # Lấy thông tin event & base_points
    event_res = supabase.table("events").select("base_points").eq("id", req.event_id).execute()
    base_points = float(event_res.data[0]["base_points"]) if event_res.data else 10.0

    att_payload = {
        "event_id": req.event_id,
        "session_id": req.session_id,
        "member_id": req.member_id,
        "member_name": "Thành viên",
        "check_in_time": datetime.utcnow().isoformat(),
        "check_in_method": req.method,
        "check_in_verified_by": current_user.id,
        "check_in_lat": req.lat,
        "check_in_lng": req.lng,
        "check_in_device": req.device_info,
        "status": "present",
        "points_earned": base_points
    }

    try:
        supabase.table("attendance").upsert(att_payload).execute()
        return GenericResponse(
            success=True,
            message=f"Điểm danh thành công! Cộng {base_points} điểm rèn luyện."
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Điểm danh thất bại: {str(e)}")


@router.get("/{event_id}/attendance", summary="Bản ghi điểm danh sự kiện")
def get_event_attendance(
    event_id: str,
    current_user: UserResponse = Depends(require_permission("attendance.manage"))
):
    """Xem danh sách bản ghi điểm danh của sự kiện."""
    supabase = get_supabase_admin()
    res = supabase.table("attendance").select("*").eq("event_id", event_id).execute()
    return res.data or []
