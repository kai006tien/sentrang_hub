"""
Sen Trắng Hub — Cloudflare R2 Storage Integration
===================================================
Module quản lý upload/download ảnh qua Cloudflare R2.
Sử dụng S3-compatible API (boto3).

Cấu hình qua biến môi trường:
    CLOUDFLARE_ACCOUNT_ID    — Account ID từ Cloudflare Dashboard
    CLOUDFLARE_R2_ACCESS_KEY — R2 Access Key ID
    CLOUDFLARE_R2_SECRET_KEY — R2 Secret Access Key
    CLOUDFLARE_R2_BUCKET     — Tên bucket (VD: sentranghub-media)
    CLOUDFLARE_R2_PUBLIC_URL — Custom domain hoặc R2 public URL
"""

import os
import uuid
import mimetypes
from datetime import datetime
from typing import Optional

try:
    import boto3
    from botocore.config import Config
except ImportError:
    raise ImportError("Cần cài boto3: pip install boto3")


class CloudflareR2:
    """Client quản lý Cloudflare R2 Storage."""

    # Thư mục mặc định cho từng loại ảnh
    FOLDERS = {
        "avatar":  "avatars/",
        "event":   "events/",
        "article": "articles/",
        "quiz":    "quizzes/",
        "club":    "club/",
    }

    ALLOWED_TYPES = {
        "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"
    }
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

    def __init__(
        self,
        account_id: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        bucket_name: Optional[str] = None,
        public_url: Optional[str] = None,
    ):
        self.account_id = account_id or os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
        self.access_key = access_key or os.environ.get("CLOUDFLARE_R2_ACCESS_KEY", "")
        self.secret_key = secret_key or os.environ.get("CLOUDFLARE_R2_SECRET_KEY", "")
        self.bucket_name = bucket_name or os.environ.get("CLOUDFLARE_R2_BUCKET", "sentranghub-media")
        self.public_url = (public_url or os.environ.get("CLOUDFLARE_R2_PUBLIC_URL", "")).rstrip("/")

        if not all([self.account_id, self.access_key, self.secret_key]):
            raise ValueError(
                "Thiếu Cloudflare R2 credentials. "
                "Hãy thiết lập CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY, CLOUDFLARE_R2_SECRET_KEY"
            )

        self.endpoint_url = f"https://{self.account_id}.r2.cloudflarestorage.com"

        self.s3 = boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            config=Config(
                signature_version="s3v4",
                retries={"max_attempts": 3, "mode": "standard"},
            ),
            region_name="auto",
        )

    def _generate_key(self, folder: str, original_filename: str, subfolder: str = "") -> str:
        """Tạo object key duy nhất: folder/subfolder/uuid_filename"""
        ext = os.path.splitext(original_filename)[1].lower()
        if not ext:
            ext = ".jpg"
        unique_name = f"{uuid.uuid4().hex[:12]}_{datetime.now().strftime('%Y%m%d')}{ext}"

        base_folder = self.FOLDERS.get(folder, f"{folder}/")
        if subfolder:
            return f"{base_folder}{subfolder}/{unique_name}"
        return f"{base_folder}{unique_name}"

    def upload_file(
        self,
        file_data: bytes,
        original_filename: str,
        folder: str = "club",
        subfolder: str = "",
        content_type: Optional[str] = None,
    ) -> dict:
        """
        Upload file lên R2.

        Args:
            file_data: Nội dung file dạng bytes
            original_filename: Tên file gốc
            folder: Loại thư mục (avatar, event, article, quiz, club)
            subfolder: Thư mục con (VD: event_id, member_id)
            content_type: MIME type (tự detect nếu không truyền)

        Returns:
            dict: {key, url, size, content_type}
        """
        # Validate
        if len(file_data) > self.MAX_FILE_SIZE:
            raise ValueError(f"File quá lớn: {len(file_data)} bytes (tối đa {self.MAX_FILE_SIZE})")

        if not content_type:
            content_type = mimetypes.guess_type(original_filename)[0] or "application/octet-stream"

        if content_type not in self.ALLOWED_TYPES:
            raise ValueError(f"Loại file không được phép: {content_type}")

        # Generate key
        key = self._generate_key(folder, original_filename, subfolder)

        # Upload
        self.s3.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=file_data,
            ContentType=content_type,
            CacheControl="public, max-age=31536000",  # Cache 1 năm
        )

        url = f"{self.public_url}/{key}" if self.public_url else key

        return {
            "key": key,
            "url": url,
            "size": len(file_data),
            "content_type": content_type,
        }

    def delete_file(self, key: str) -> bool:
        """Xóa file từ R2."""
        try:
            self.s3.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except Exception:
            return False

    def get_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """Tạo presigned URL cho download (nếu bucket private)."""
        return self.s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": key},
            ExpiresIn=expires_in,
        )

    def get_presigned_upload_url(
        self, key: str, content_type: str = "image/jpeg", expires_in: int = 600
    ) -> dict:
        """
        Tạo presigned URL cho client-side upload (direct upload từ browser).

        Returns:
            dict: {url, key, fields} — dùng cho FormData upload
        """
        presigned = self.s3.generate_presigned_post(
            Bucket=self.bucket_name,
            Key=key,
            Fields={"Content-Type": content_type},
            Conditions=[
                {"Content-Type": content_type},
                ["content-length-range", 1, self.MAX_FILE_SIZE],
            ],
            ExpiresIn=expires_in,
        )
        return presigned

    def list_files(self, prefix: str = "", max_keys: int = 100) -> list:
        """Liệt kê files trong thư mục."""
        response = self.s3.list_objects_v2(
            Bucket=self.bucket_name,
            Prefix=prefix,
            MaxKeys=max_keys,
        )
        files = []
        for obj in response.get("Contents", []):
            files.append({
                "key": obj["Key"],
                "size": obj["Size"],
                "last_modified": obj["LastModified"].isoformat(),
                "url": f"{self.public_url}/{obj['Key']}" if self.public_url else obj["Key"],
            })
        return files


# ═══════════════════════════════════════════════════════════════════
# Singleton instance
# ═══════════════════════════════════════════════════════════════════

_r2_client: Optional[CloudflareR2] = None


def get_r2_client() -> CloudflareR2:
    """Lấy singleton R2 client."""
    global _r2_client
    if _r2_client is None:
        _r2_client = CloudflareR2()
    return _r2_client
