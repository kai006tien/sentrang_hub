"""
Sen Trắng Hub — Application Configuration
==========================================
Nạp biến môi trường bằng pydantic-settings.
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_SECRET_KEY: str = "sentranghub-secret-key-2026"

    # Supabase (Sử dụng os.environ.get an toàn)
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "https://fjshckqpfkjsbpfkojhm.supabase.co")
    SUPABASE_ANON_KEY: str = os.environ.get("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    # Cloudflare R2
    CLOUDFLARE_ACCOUNT_ID: str = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "efbb65895f1e9cb0cb70e279a6ea4f31")
    CLOUDFLARE_R2_ACCESS_KEY: str = ""
    CLOUDFLARE_R2_SECRET_KEY: str = ""
    CLOUDFLARE_R2_BUCKET: str = "sentranghub-media"
    CLOUDFLARE_R2_PUBLIC_URL: str = ""

    # Super Admin
    SUPER_ADMIN_EMAIL: str = "admin@sentranghub.vn"
    SUPER_ADMIN_PASSWORD: str = "SenTrang@2026!"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
