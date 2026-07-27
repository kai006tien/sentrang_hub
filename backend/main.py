"""
Sen Trắng Hub — Backend API Main Application
=============================================
Framework: FastAPI (Python 3.10+)
Database & Auth: Supabase (PostgreSQL)
Storage: Cloudflare R2
Deployment: Vercel / Uvicorn
"""

import sys
import os
import time

# Ensure project root is in sys.path for Vercel Serverless Functions
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse

from backend.config import get_settings
from backend.routers import auth, users, roles, events, articles, quizzes

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

settings = get_settings()

app = FastAPI(
    title="Sen Trắng Hub API",
    description="Hệ thống Quản trị Nội bộ — Câu lạc bộ Thanh niên Tình nguyện Sen Trắng",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# ─── STATIC FILES MOUNT ───────────────────────────────────────────
assets_dir = os.path.join(FRONTEND_DIR, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# ─── CORS MIDDLEWARE ───────────────────────────────────────────────
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://127.0.0.1:5500",
    "https://sentranghub.vn",
    "https://ht-ien.vercel.app",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── PROCESS TIME & LOGGING MIDDLEWARE ─────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response


# ─── ROUTER MOUNTING ───────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(events.router)
app.include_router(articles.router)
app.include_router(quizzes.router)


# ─── HEALTH CHECK & API ENDPOINTS ─────────────────────────────────
@app.get("/api", tags=["Health Check"])
def root():
    return {
        "system": "Sen Trắng Hub API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/health", tags=["Health Check"])
def health_check():
    return {
        "status": "ok",
        "environment": settings.APP_ENV,
        "debug": settings.APP_DEBUG,
        "database": "Supabase PostgreSQL",
        "storage": "Cloudflare R2"
    }


# ─── GLOBAL EXCEPTION HANDLERS ────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Đã xảy ra lỗi hệ thống không mong muốn.",
            "detail": str(exc) if settings.APP_DEBUG else None
        }
    )


# ─── CATCH-ALL ROUTE FOR FRONTEND STATIC SITE ─────────────────────
@app.get("/{full_path:path}", response_class=FileResponse)
async def catch_all(full_path: str = ""):
    clean_path = full_path.lstrip("/")
    
    # 1. Exact file match in frontend directory
    if clean_path:
        file_path = os.path.join(FRONTEND_DIR, clean_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        # 2. Page with .html extension
        html_path = os.path.join(FRONTEND_DIR, f"{clean_path}.html")
        if os.path.isfile(html_path):
            return FileResponse(html_path)

    # 3. Default fallback to index.html
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)

    return HTMLResponse("<h1>Sen Trắng Hub</h1>")
