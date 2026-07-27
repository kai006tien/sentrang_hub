"""
Sen Trắng Hub — Supabase Client
================================
Khởi tạo và quản lý kết nối Supabase.
"""

import os
from typing import Optional

try:
    from supabase import create_client, Client
except ImportError:
    raise ImportError("Cần cài supabase: pip install supabase")


_supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    """Lấy singleton Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

        if not url or not key:
            raise ValueError(
                "Thiếu Supabase credentials. "
                "Hãy thiết lập SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY"
            )

        _supabase_client = create_client(url, key)
    return _supabase_client


def get_supabase_anon() -> Client:
    """Lấy Supabase client với anon key (cho frontend)."""
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_ANON_KEY", "")

    if not url or not key:
        raise ValueError(
            "Thiếu Supabase credentials. "
            "Hãy thiết lập SUPABASE_URL và SUPABASE_ANON_KEY"
        )

    return create_client(url, key)
