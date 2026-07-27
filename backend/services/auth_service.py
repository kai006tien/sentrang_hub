"""
Sen Trắng Hub — Authentication & Authorization Service
========================================================
Xử lý logic Đăng nhập, Đăng ký, Lấy thông tin User, Phân quyền.
Giao tiếp trực tiếp với Supabase Auth & PostgreSQL.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from backend.config import get_settings
from backend.services.supabase_client import get_supabase_admin, get_supabase_anon
from backend.models.auth import (
    LoginRequest, RegisterRequest, UserResponse, TokenResponse,
    RoleResponse, PermissionResponse
)


class AuthService:

    @staticmethod
    def get_user_permissions(role_id: str) -> List[str]:
        """Lấy danh sách permission keys của 1 role_id."""
        supabase = get_supabase_admin()
        res = supabase.table("role_permissions").select("permission_id").eq("role_id", role_id).execute()
        if res.data:
            return [item["permission_id"] for item in res.data]
        return []

    @staticmethod
    def get_user_with_role(user_id: str) -> UserResponse:
        """Lấy thông tin User chi tiết kèm Role và Permissions."""
        supabase = get_supabase_admin()
        
        # Query bảng users
        user_res = supabase.table("users").select("*").eq("id", user_id).execute()
        if not user_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy người dùng trong hệ thống."
            )
        
        user_data = user_res.data[0]
        role_id = user_data.get("role_id", "role_thanh_vien")

        # Query bảng roles
        role_name = None
        role_level = 10
        role_res = supabase.table("roles").select("name, level").eq("id", role_id).execute()
        if role_res.data:
            role_name = role_res.data[0]["name"]
            role_level = role_res.data[0]["level"]

        # Permissions
        permissions = AuthService.get_user_permissions(role_id)

        return UserResponse(
            id=str(user_data["id"]),
            email=user_data["email"],
            display_name=user_data["display_name"],
            avatar_url=user_data.get("avatar_url"),
            phone_number=user_data.get("phone_number"),
            role_id=role_id,
            role_name=role_name,
            role_level=role_level,
            member_id=str(user_data["member_id"]) if user_data.get("member_id") else None,
            is_active=user_data.get("is_active", True),
            permissions=permissions,
            last_login_at=user_data.get("last_login_at"),
            created_at=user_data.get("created_at") or datetime.utcnow()
        )

    @staticmethod
    def login(req: LoginRequest) -> TokenResponse:
        """Đăng nhập bằng Email/Password qua Supabase Auth."""
        supabase_anon = get_supabase_anon()
        supabase_admin = get_supabase_admin()
        settings = get_settings()
        
        auth_res = None
        try:
            auth_res = supabase_anon.auth.sign_in_with_password({
                "email": req.email,
                "password": req.password
            })
        except Exception as e:
            # Tự động tạo tài khoản Super Admin mặc định nếu khớp credentials trong settings
            if req.email == settings.SUPER_ADMIN_EMAIL and req.password == settings.SUPER_ADMIN_PASSWORD:
                try:
                    admin_user = supabase_admin.auth.admin.create_user({
                        "email": req.email,
                        "password": req.password,
                        "email_confirm": True,
                        "user_metadata": {"display_name": "Super Admin"}
                    })
                    admin_uid = admin_user.user.id
                    
                    supabase_admin.table("users").upsert({
                        "id": admin_uid,
                        "email": req.email,
                        "display_name": "Super Admin",
                        "role_id": "role_super_admin",
                        "is_active": True
                    }).execute()
                    
                    auth_res = supabase_anon.auth.sign_in_with_password({
                        "email": req.email,
                        "password": req.password
                    })
                except Exception as create_err:
                    print(f"⚠️ Auto-provisioning Super Admin fallback: {create_err}")

            if not auth_res:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Đăng nhập thất bại: Email hoặc mật khẩu không chính xác."
                )

        if not auth_res.user or not auth_res.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Đăng nhập thất bại: Không thể khởi tạo phiên làm việc."
            )

        user_id = auth_res.user.id
        supabase_admin = get_supabase_admin()

        # Kiểm tra xem profile đã có trong bảng public.users chưa
        user_db = supabase_admin.table("users").select("*").eq("id", user_id).execute()
        if not user_db.data:
            # Tạo profile mặc định nếu trigger SQL chưa chạy
            supabase_admin.table("users").insert({
                "id": user_id,
                "email": req.email,
                "display_name": req.email.split("@")[0],
                "role_id": "role_thanh_vien",
                "is_active": True
            }).execute()

        # Cập nhật last_login_at
        supabase_admin.table("users").update({
            "last_login_at": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()

        # Lấy đầy đủ profile + permissions
        user_info = AuthService.get_user_with_role(user_id)

        if not user_info.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin."
            )

        return TokenResponse(
            access_token=auth_res.session.access_token,
            refresh_token=auth_res.session.refresh_token,
            expires_in=auth_res.session.expires_in,
            user=user_info
        )

    @staticmethod
    def register(req: RegisterRequest, created_by_uid: Optional[str] = None) -> UserResponse:
        """Đăng ký / Tạo tài khoản mới."""
        supabase_admin = get_supabase_admin()

        # Kiểm tra email tồn tại trong public.users
        existing = supabase_admin.table("users").select("id").eq("email", req.email).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email này đã được sử dụng."
            )

        # Tạo user trên Supabase Auth
        try:
            auth_user = supabase_admin.auth.admin.create_user({
                "email": req.email,
                "password": req.password,
                "email_confirm": True,
                "user_metadata": {
                    "display_name": req.display_name
                }
            })
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Lỗi tạo tài khoản Auth: {str(e)}"
            )

        new_uid = auth_user.user.id

        # Đảm bảo profile được lưu/cập nhật đúng trong public.users
        user_payload = {
            "id": new_uid,
            "email": req.email,
            "display_name": req.display_name,
            "phone_number": req.phone_number,
            "role_id": req.role_id or "role_thanh_vien",
            "is_active": True,
            "created_by": created_by_uid or new_uid
        }

        supabase_admin.table("users").upsert(user_payload).execute()

        # Ghi log hoạt động
        try:
            supabase_admin.table("activity_logs").insert({
                "user_id": created_by_uid or new_uid,
                "user_name": req.display_name,
                "action": "user.register",
                "module": "users",
                "target_id": new_uid,
                "target_type": "user",
                "description": f"Tạo tài khoản mới cho: {req.display_name} ({req.email})"
            }).execute()
        except Exception:
            pass

        return AuthService.get_user_with_role(new_uid)

    @staticmethod
    def verify_token(access_token: str) -> UserResponse:
        """Xác thực JWT token từ Header và trả về thông tin User."""
        supabase_admin = get_supabase_admin()
        
        try:
            user_res = supabase_admin.auth.get_user(access_token)
            if not user_res or not user_res.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token không hợp lệ hoặc đã hết hạn."
                )
            user_id = user_res.user.id
            return AuthService.get_user_with_role(user_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Xác thực Token thất bại: {str(e)}"
            )
