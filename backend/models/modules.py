"""
Sen Trắng Hub — Pydantic Schemas for Core Modules
(Events, Attendance, Articles, Quizzes)
=================================================
"""

from datetime import datetime, date, time
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════════
# 1. EVENTS & ATTENDANCE SCHEMAS
# ═══════════════════════════════════════════════════════════════════

class FormFieldSchema(BaseModel):
    name: str
    label: str
    type: str = "text"  # text | textarea | select
    required: bool = True
    options: Optional[List[str]] = []


class EventCreateRequest(BaseModel):
    title: str = Field(..., example="Chiến dịch Mùa hè xanh 2026")
    slug: Optional[str] = None
    description: Optional[str] = ""
    category: str = Field("volunteer", example="volunteer")  # volunteer | training | social | meeting | other
    cover_image_url: Optional[str] = None
    location: str = Field(..., example="Huyện Cần Giờ, TP.HCM")
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    registration_open: Optional[datetime] = None
    registration_close: Optional[datetime] = None
    max_participants: int = 50
    requires_approval: bool = True
    form_fields: Optional[List[FormFieldSchema]] = []
    base_points: float = 10.0
    bonus_points: float = 5.0
    visibility: str = "public"  # public | members_only | private


class EventResponse(BaseModel):
    id: str
    title: str
    slug: str
    description: Optional[str] = ""
    category: str
    cover_image_url: Optional[str] = None
    location: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    max_participants: int
    current_count: int
    is_registration_open: bool
    requires_approval: bool
    base_points: float
    status: str
    visibility: str
    created_at: datetime


class CheckInRequest(BaseModel):
    event_id: str
    session_id: str
    member_id: str
    method: str = "qr_code"  # qr_code | manual
    lat: Optional[float] = None
    lng: Optional[float] = None
    device_info: Optional[str] = "Web Browser"


# ═══════════════════════════════════════════════════════════════════
# 2. ARTICLES CMS SCHEMAS
# ═══════════════════════════════════════════════════════════════════

class ArticleCreateRequest(BaseModel):
    title: str = Field(..., example="Sen Trắng — Hành trình 12 năm vì cộng đồng")
    slug: Optional[str] = None
    excerpt: str = Field(..., example="Tóm tắt ngắn bài viết...")
    content: str = Field(..., example="<h2>Nội dung HTML bài viết</h2>...")
    content_format: str = "html"
    cover_image_url: Optional[str] = None
    category: str = "tin-tuc"  # tin-tuc | su-kien | bai-viet | thong-bao
    tags: Optional[List[str]] = []
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class ArticleResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str
    content: str
    content_format: str
    cover_image_url: Optional[str] = None
    category: str
    tags: List[str] = []
    author_name: Optional[str] = None
    status: str
    is_pinned: bool
    is_featured: bool
    view_count: int
    published_at: Optional[datetime] = None
    created_at: datetime


# ═══════════════════════════════════════════════════════════════════
# 3. QUIZZES SCHEMAS
# ═══════════════════════════════════════════════════════════════════

class OptionSchema(BaseModel):
    id: str
    text: str
    is_correct: Optional[bool] = None  # Giấu is_correct khi thí sinh thi


class QuestionCreateRequest(BaseModel):
    question_text: str
    question_type: str = "single_choice"  # single_choice | multiple_choice | true_false
    options: List[OptionSchema]
    explanation: Optional[str] = ""
    points: float = 1.0
    difficulty: str = "medium"


class QuizCreateRequest(BaseModel):
    title: str = Field(..., example="Kiểm tra kiến thức tình nguyện viên 2026")
    description: Optional[str] = ""
    cover_image_url: Optional[str] = None
    category: str = "orientation"
    duration: int = 1800  # Giây (30 phút)
    passing_score: int = 70  # %
    max_attempts: int = 2
    shuffle_questions: bool = True
    shuffle_options: bool = True
    show_result_immediately: bool = True


class AnswerSubmitSchema(BaseModel):
    question_id: str
    selected_options: List[str]


class QuizSubmitRequest(BaseModel):
    answers: List[AnswerSubmitSchema]
