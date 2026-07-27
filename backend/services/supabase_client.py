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
    """Lấy Supabase client với service_role key."""
    global _supabase_admin_client
    if _supabase_admin_client is None:
        settings = get_settings()
        url = settings.SUPABASE_URL or "https://fjshckqpfkjsbpfkojhm.supabase.co"
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY or "sb_publishable_E9vO4U5GhxvrHqqgArcjMQ_4nQE6vtR"
        try:
            _supabase_admin_client = create_client(url, key)
        except Exception as e:
            print(f"⚠️ Exception creating Supabase Admin Client: {e}")
            _supabase_admin_client = create_client("https://fjshckqpfkjsbpfkojhm.supabase.co", "sb_publishable_E9vO4U5GhxvrHqqgArcjMQ_4nQE6vtR")
    return _supabase_admin_client


def get_supabase_anon() -> Client:
    """Lấy Supabase client với anon key."""
    global _supabase_anon_client
    if _supabase_anon_client is None:
        settings = get_settings()
        url = settings.SUPABASE_URL or "https://fjshckqpfkjsbpfkojhm.supabase.co"
        key = settings.SUPABASE_ANON_KEY or "sb_publishable_E9vO4U5GhxvrHqqgArcjMQ_4nQE6vtR"
        try:
            _supabase_anon_client = create_client(url, key)
        except Exception as e:
            print(f"⚠️ Exception creating Supabase Anon Client: {e}")
            _supabase_anon_client = create_client("https://fjshckqpfkjsbpfkojhm.supabase.co", "sb_publishable_E9vO4U5GhxvrHqqgArcjMQ_4nQE6vtR")
    return _supabase_anon_client
