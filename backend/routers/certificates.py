"""
Sen Trắng Hub — Certificates & Leaderboard Router
=================================================
Bảng xếp hạng vinh danh cá nhân & Cấp chứng nhận điện tử
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from backend.services.supabase_client import get_supabase_admin_client

router = APIRouter(prefix="/api/v1/certificates", tags=["Khen thưởng & Chứng nhận"])

@router.get("/leaderboard", summary="Bảng xếp hạng vinh danh điểm rèn luyện")
def get_leaderboard(period: Optional[str] = "month", limit: int = 20):
    supabase = get_supabase_admin_client()
    res = supabase.table("members").select("id, full_name, avatar_url, generation, department, total_points, attendance_points, quiz_points, bonus_points").order("total_points", desc=True).limit(limit).execute()
    
    leaderboard = []
    for idx, item in enumerate(res.data, start=1):
        item["rank"] = idx
        leaderboard.append(item)
        
    return {
        "success": True,
        "period": period,
        "data": leaderboard,
        "count": len(leaderboard)
    }

@router.get("/{member_id}/issue", summary="Trích xuất dữ liệu Giấy chứng nhận điện tử")
def issue_certificate(member_id: str):
    supabase = get_supabase_admin_client()
    res = supabase.table("members").select("*").eq("id", member_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Không tìm thấy thành viên.")
    
    member = res.data[0]
    return {
        "success": True,
        "certificate": {
            "certificate_id": f"STH-2026-{member_id[:8].upper()}",
            "recipient_name": member["full_name"],
            "student_id": member.get("student_id", "STH-MEM"),
            "generation": member.get("generation", "Gen 1"),
            "department": member.get("department", "Ban Chuyên môn"),
            "title": "GIẤY CHỨNG NHẬN THÀNH VIÊN XUẤT SẮC",
            "reason": "Đã có thành tích hoạt động tình nguyện rèn luyện xuất sắc và đóng góp tích cực cho CLB Thanh niên Tình nguyện Sen Trắng năm 2026.",
            "issued_date": "27/07/2026",
            "total_points": member.get("total_points", 0),
            "issued_by": "BAN CHỦ NHIỆM CLB THANH NIÊN TÌNH NGUYỆN SEN TRẮNG"
        }
    }
