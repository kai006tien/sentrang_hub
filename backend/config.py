"""
Sen Trắng Hub — Application Configuration
==========================================
Nạp biến môi trường bằng pydantic-settings.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_SECRET_KEY: str = "sentranghub-secret-key-2026"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Cloudflare R2
    CLOUDFLARE_ACCOUNT_ID: str = ""
    CLOUDFLARE_R2_ACCESS_KEY: str = ""
    CLOUDFLARE_R2_SECRET_KEY: str = ""
    CLOUDFLARE_R2_BUCKET: str = "sentranghub-media"
    CLOUDFLARE_R2_PUBLIC_URL: str = ""

    # Super Admin (For initial seed/setup)
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
