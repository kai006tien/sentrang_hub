"""
Sen Trắng Hub — Backend API Main Application
=============================================
Framework: FastAPI (Python 3.10+)
Database & Auth: Supabase (PostgreSQL)
Storage: Cloudflare R2
Deployment: Vercel / Uvicorn
"""

import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import get_settings
from backend.routers import auth, users, roles, events, articles, quizzes

settings = get_settings()

app = FastAPI(
    title="Sen Trắng Hub API",
    description="Hệ thống Quản trị Nội bộ — Câu lạc bộ Thanh niên Tình nguyện Sen Trắng",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

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


# ─── HEALTH CHECK & ROOT ENDPOINTS ────────────────────────────────
@app.get("/", tags=["Health Check"])
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
