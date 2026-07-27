"""
Sen Trắng Hub — Supabase Client Singleton
==========================================
"""

from typing import Optional
from supabase import create_client, Client
from backend.config import get_settings


_supabase_admin_client: Optional[Client] = None
_supabase_anon_client: Optional[Client] = None


def get_supabase_admin() -> Client:
    """Lấy Supabase client với service_role key (bỏ qua RLS, dành cho backend API)."""
    global _supabase_admin_client
    if _supabase_admin_client is None:
        settings = get_settings()
        _supabase_admin_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
    return _supabase_admin_client


def get_supabase_anon() -> Client:
    """Lấy Supabase client với anon key."""
    global _supabase_anon_client
    if _supabase_anon_client is None:
        settings = get_settings()
        _supabase_anon_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )
    return _supabase_anon_client
