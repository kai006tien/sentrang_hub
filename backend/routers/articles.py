"""
Sen Trắng Hub — Articles CMS API Router
========================================
Endpoints:
- GET    /api/articles
- POST   /api/articles
- GET    /api/articles/{id_or_slug}
- PUT    /api/articles/{id}
- PUT    /api/articles/{id}/publish
- DELETE /api/articles/{id}
- POST   /api/articles/upload-image (Cloudflare R2 Integration)
"""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from backend.models.auth import UserResponse, GenericResponse
from backend.models.modules import ArticleCreateRequest, ArticleResponse
from backend.services.supabase_client import get_supabase_admin
from backend.services.cloudflare_r2 import get_r2_client
from backend.dependencies import get_current_user, require_permission


router = APIRouter(prefix="/api/articles", tags=["Articles CMS"])


@router.get("", response_model=List[ArticleResponse], summary="Danh sách bài viết")
def list_articles(
    category: Optional[str] = Query(None, description="Lọc theo danh mục"),
    status_val: Optional[str] = Query(None, alias="status", description="draft | review | published"),
    limit: int = 20,
    offset: int = 0
):
    """Lấy danh sách bài viết báo chí / tin tức."""
    supabase = get_supabase_admin()
    query = supabase.table("articles").select("*")

    if category:
        query = query.eq("category", category)
    if status_val:
        query = query.eq("status", status_val)

    res = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

    articles = []
    for item in res.data:
        articles.append(ArticleResponse(
            id=str(item["id"]),
            title=item["title"],
            slug=item["slug"],
            excerpt=item.get("excerpt", ""),
            content=item.get("content", ""),
            content_format=item.get("content_format", "html"),
            cover_image_url=item.get("cover_image_url"),
            category=item.get("category", "tin-tuc"),
            tags=item.get("tags") or [],
            author_name=item.get("author_name") or "Ban Truyền thông",
            status=item.get("status", "draft"),
            is_pinned=item.get("is_pinned", False),
            is_featured=item.get("is_featured", False),
            view_count=item.get("view_count", 0),
            published_at=item.get("published_at"),
            created_at=item.get("created_at") or datetime.utcnow()
        ))
    return articles


@router.post("", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED, summary="Tạo bài viết mới")
def create_article(
    req: ArticleCreateRequest,
    current_user: UserResponse = Depends(require_permission("articles.create"))
):
    """Soạn bài viết báo chí mới (ở dạng Draft)."""
    supabase = get_supabase_admin()

    slug = req.slug or req.title.lower().replace(" ", "-").replace("/", "-")
    existing = supabase.table("articles").select("id").eq("slug", slug).execute()
    if existing.data:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    payload = {
        "title": req.title,
        "slug": slug,
        "excerpt": req.excerpt,
        "content": req.content,
        "content_format": req.content_format,
        "cover_image_url": req.cover_image_url,
        "category": req.category,
        "tags": req.tags or [],
        "author_id": current_user.member_id or current_user.id,
        "author_name": current_user.display_name,
        "meta_title": req.meta_title or req.title,
        "meta_description": req.meta_description or req.excerpt,
        "status": "draft",
        "created_by": current_user.id
    }

    res = supabase.table("articles").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Không thể tạo bài viết.")

    item = res.data[0]
    return ArticleResponse(
        id=str(item["id"]),
        title=item["title"],
        slug=item["slug"],
        excerpt=item["excerpt"],
        content=item["content"],
        content_format=item["content_format"],
        cover_image_url=item.get("cover_image_url"),
        category=item["category"],
        tags=item.get("tags") or [],
        author_name=item["author_name"],
        status=item["status"],
        is_pinned=False,
        is_featured=False,
        view_count=0,
        published_at=None,
        created_at=item.get("created_at") or datetime.utcnow()
    )


@router.put("/{article_id}/publish", response_model=GenericResponse, summary="Xuất bản bài viết")
def publish_article(
    article_id: str,
    status_val: str = Query("published", alias="status", description="published | draft"),
    current_user: UserResponse = Depends(require_permission("articles.publish"))
):
    """Xuất bản bài viết lên trang chủ CLB hoặc gỡ về bản nháp."""
    supabase = get_supabase_admin()
    
    payload = {
        "status": status_val,
        "published_at": datetime.utcnow().isoformat() if status_val == "published" else None
    }

    res = supabase.table("articles").update(payload).eq("id", article_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại.")

    action_text = "được xuất bản" if status_val == "published" else "chuyển về bản nháp"
    return GenericResponse(success=True, message=f"Bài viết đã {action_text} thành công.")


@router.post("/upload-image", summary="Upload ảnh bài viết lên Cloudflare R2")
async def upload_article_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(require_permission("articles.create"))
):
    """Upload hình ảnh bài viết trực tiếp lên Cloudflare R2 Storage."""
    file_bytes = await file.read()
    r2 = get_r2_client()

    try:
        result = r2.upload_file(
            file_data=file_bytes,
            original_filename=file.filename,
            folder="article",
            content_type=file.content_type
        )
        return {
            "success": True,
            "url": result["url"],
            "key": result["key"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload ảnh thất bại: {str(e)}")
