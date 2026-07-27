"""
Sen Trắng Hub — Quizzes & Training Assessment API Router
=========================================================
Endpoints:
- GET    /api/quizzes
- POST   /api/quizzes
- GET    /api/quizzes/{quiz_id}
- GET    /api/quizzes/{quiz_id}/questions
- POST   /api/quizzes/{quiz_id}/questions
- POST   /api/quizzes/{quiz_id}/start
- POST   /api/quizzes/attempts/{attempt_id}/submit
- GET    /api/quizzes/{quiz_id}/leaderboard
"""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from backend.models.auth import UserResponse, GenericResponse
from backend.models.modules import (
    QuizCreateRequest, QuestionCreateRequest, QuizSubmitRequest
)
from backend.services.supabase_client import get_supabase_admin
from backend.dependencies import get_current_user, require_permission


router = APIRouter(prefix="/api/quizzes", tags=["Training & Quizzes"])


@router.get("", summary="Danh sách bài thi trắc nghiệm")
def list_quizzes(category: Optional[str] = None):
    """Lấy danh sách các bài thi trắc nghiệm trong hệ thống."""
    supabase = get_supabase_admin()
    query = supabase.table("quizzes").select("*")
    if category:
        query = query.eq("category", category)
    res = query.order("created_at", desc=True).execute()
    return res.data or []


@router.post("", status_code=status.HTTP_201_CREATED, summary="Tạo bài thi trắc nghiệm mới")
def create_quiz(
    req: QuizCreateRequest,
    current_user: UserResponse = Depends(require_permission("quizzes.create"))
):
    """Tạo cấu hình bài thi trắc nghiệm (Thời gian, điểm đạt, xáo trộn câu hỏi)."""
    supabase = get_supabase_admin()

    payload = {
        "title": req.title,
        "description": req.description,
        "cover_image_url": req.cover_image_url,
        "category": req.category,
        "duration": req.duration,
        "passing_score": req.passing_score,
        "max_attempts": req.max_attempts,
        "shuffle_questions": req.shuffle_questions,
        "shuffle_options": req.shuffle_options,
        "show_result_immediately": req.show_result_immediately,
        "status": "active",
        "created_by": current_user.id
    }

    res = supabase.table("quizzes").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Không thể tạo bài thi.")

    return res.data[0]


@router.get("/{quiz_id}", summary="Chi tiết bài thi")
def get_quiz(quiz_id: str):
    """Lấy chi tiết 1 bài thi trắc nghiệm."""
    supabase = get_supabase_admin()
    res = supabase.table("quizzes").select("*").eq("id", quiz_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Bài thi không tồn tại.")
    return res.data[0]


@router.get("/{quiz_id}/questions", summary="Danh sách câu hỏi bài thi")
def get_quiz_questions(
    quiz_id: str,
    for_take: bool = Query(True, description="Giấu đáp án đúng khi thí sinh đang thi"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Lấy danh sách câu hỏi của bài thi."""
    supabase = get_supabase_admin()
    res = supabase.table("questions").select("*").eq("quiz_id", quiz_id).order("sort_order").execute()
    questions = res.data or []

    # Nếu người dùng đang thi -> Giấu is_correct & explanation khỏi response
    if for_take and "quizzes.create" not in current_user.permissions:
        for q in questions:
            q.pop("explanation", None)
            if "options" in q and isinstance(q["options"], list):
                for opt in q["options"]:
                    opt.pop("isCorrect", None)
                    opt.pop("is_correct", None)

    return questions


@router.post("/{quiz_id}/questions", status_code=status.HTTP_201_CREATED, summary="Thêm câu hỏi vào bài thi")
def add_question(
    quiz_id: str,
    req: QuestionCreateRequest,
    current_user: UserResponse = Depends(require_permission("quizzes.create"))
):
    """Thêm 1 câu hỏi mới vào ngân hàng câu hỏi của bài thi."""
    supabase = get_supabase_admin()

    payload = {
        "quiz_id": quiz_id,
        "question_text": req.question_text,
        "question_type": req.question_type,
        "options": [opt.model_dump() for opt in req.options],
        "explanation": req.explanation,
        "points": req.points,
        "difficulty": req.difficulty
    }

    res = supabase.table("questions").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Thêm câu hỏi thất bại.")

    # Cập nhật total_questions trong quizzes
    q_count = supabase.table("questions").select("id", count="exact").eq("quiz_id", quiz_id).execute()
    count_val = len(q_count.data) if q_count.data else 1
    supabase.table("quizzes").update({"total_questions": count_val}).eq("id", quiz_id).execute()

    return res.data[0]


@router.post("/{quiz_id}/start", summary="Bắt đầu lượt thi mới")
def start_quiz(
    quiz_id: str,
    current_user: UserResponse = Depends(require_permission("quizzes.take"))
):
    """Bắt đầu 1 lượt làm bài thi. Trả về Attempt ID và thời gian server đếm ngược."""
    supabase = get_supabase_admin()

    quiz_res = supabase.table("quizzes").select("*").eq("id", quiz_id).execute()
    if not quiz_res.data:
        raise HTTPException(status_code=404, detail="Bài thi không tồn tại.")
    
    quiz = quiz_res.data[0]
    member_id = current_user.member_id or current_user.id

    # Đếm số lượt đã thi
    attempts_res = supabase.table("quiz_attempts").select("id").eq("quiz_id", quiz_id).eq("member_id", member_id).execute()
    attempt_count = len(attempts_res.data) if attempts_res.data else 0

    if quiz.get("max_attempts", 0) > 0 and attempt_count >= quiz["max_attempts"]:
        raise HTTPException(
            status_code=400,
            detail=f"Bạn đã dùng hết {quiz['max_attempts']} lần thi tối đa cho bài thi này."
        )

    attempt_payload = {
        "quiz_id": quiz_id,
        "quiz_title": quiz["title"],
        "member_id": member_id,
        "member_name": current_user.display_name,
        "attempt_number": attempt_count + 1,
        "started_at": datetime.utcnow().isoformat(),
        "status": "in_progress"
    }

    res = supabase.table("quiz_attempts").insert(attempt_payload).execute()
    attempt = res.data[0]

    return {
        "attempt_id": str(attempt["id"]),
        "quiz_id": quiz_id,
        "duration": quiz["duration"],
        "started_at": attempt["started_at"]
    }


@router.post("/attempts/{attempt_id}/submit", summary="Nộp bài & Tự động chấm điểm")
def submit_quiz_attempt(
    attempt_id: str,
    req: QuizSubmitRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Nộp bài làm ➔ Tự động so sánh đáp án ➔ Tính điểm % ➔ Đánh giá Đạt/Không Đạt ➔ Xếp loại Grade.
    """
    supabase = get_supabase_admin()

    attempt_res = supabase.table("quiz_attempts").select("*").eq("id", attempt_id).execute()
    if not attempt_res.data:
        raise HTTPException(status_code=404, detail="Lượt thi không tồn tại.")

    attempt = attempt_res.data[0]
    if attempt.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Lượt thi này đã được nộp bài trước đó.")

    quiz_id = attempt["quiz_id"]
    quiz_res = supabase.table("quizzes").select("*").eq("id", quiz_id).execute()
    quiz = quiz_res.data[0]

    # Lấy đáp án chuẩn từ bảng questions
    questions_res = supabase.table("questions").select("*").eq("quiz_id", quiz_id).execute()
    questions_map = {str(q["id"]): q for q in (questions_res.data or [])}

    total_earned = 0.0
    max_possible = 0.0
    correct_count = 0
    incorrect_count = 0
    answers_detail = []

    submitted_map = {a.question_id: a.selected_options for a in req.answers}

    for q_id, q_data in questions_map.items():
        q_points = float(q_data.get("points", 1.0))
        max_possible += q_points

        correct_option_ids = set()
        for opt in q_data.get("options", []):
            if opt.get("isCorrect") or opt.get("is_correct"):
                correct_option_ids.add(str(opt["id"]))

        user_selected = set(submitted_map.get(q_id, []))

        is_correct = user_selected == correct_option_ids
        earned = q_points if is_correct else 0.0

        if is_correct:
            correct_count += 1
            total_earned += earned
        else:
            incorrect_count += 1

        answers_detail.append({
            "questionId": q_id,
            "selectedOptions": list(user_selected),
            "isCorrect": is_correct,
            "pointsEarned": earned
        })

    # Tính phần trăm điểm
    score_percent = round((total_earned / max_possible * 100), 1) if max_possible > 0 else 0.0
    passing_score = quiz.get("passing_score", 70)
    passed = score_percent >= passing_score

    # Xếp loại Grade
    grade = "F"
    if score_percent >= 90: grade = "A"
    elif score_percent >= 80: grade = "B"
    elif score_percent >= 70: grade = "C"
    elif score_percent >= 60: grade = "D"

    # Cập nhật bản ghi attempt
    update_payload = {
        "submitted_at": datetime.utcnow().isoformat(),
        "answers": answers_detail,
        "total_points": total_earned,
        "max_points": max_possible,
        "score_percent": score_percent,
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "passed": passed,
        "grade": grade,
        "status": "completed"
    }

    supabase.table("quiz_attempts").update(update_payload).eq("id", attempt_id).execute()

    # Cập nhật tổng điểm rèn luyện của member trong public.members
    try:
        member_id = attempt["member_id"]
        supabase.rpc("update_member_quiz_points", {"p_member_id": member_id, "p_points": total_earned}).execute()
    except Exception:
        pass

    return {
        "attempt_id": attempt_id,
        "total_points": total_earned,
        "max_points": max_possible,
        "score_percent": score_percent,
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "passed": passed,
        "grade": grade,
        "message": "Chúc mừng bạn đã ĐẠT bài kiểm tra!" if passed else "Rất tiếc bạn chưa đạt điểm tối thiểu."
    }


@router.get("/{quiz_id}/leaderboard", summary="Bảng xếp hạng kết quả làm bài")
def get_quiz_leaderboard(quiz_id: str):
    """Lấy bảng xếp hạng kết quả điểm cao nhất của bài thi."""
    supabase = get_supabase_admin()
    res = supabase.table("quiz_attempts") \
        .select("id, member_name, score_percent, grade, passed, submitted_at") \
        .eq("quiz_id", quiz_id) \
        .eq("status", "completed") \
        .order("score_percent", desc=True) \
        .limit(20) \
        .execute()
    return res.data or []
