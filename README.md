# 🌸 Sen Trắng Hub — Hệ thống Quản trị Nội bộ

> Hệ thống quản trị nội bộ dành cho **Câu lạc bộ Thanh niên Tình nguyện Sen Trắng**

## 🏗️ Tech Stack

| Thành phần | Công nghệ |
|-----------|-----------|
| **Database** | [Supabase](https://supabase.com) (PostgreSQL + Auth + Realtime) |
| **Backend** | Python (FastAPI) |
| **Frontend** | HTML / CSS / JavaScript |
| **Hosting** | [Vercel](https://vercel.com) |
| **Image Storage** | [Cloudflare R2](https://www.cloudflare.com/products/r2/) |
| **Version Control** | GitHub |

## 📁 Cấu trúc dự án

```
STRer_Hub/
├── vercel.json                # Cấu hình Vercel Hosting
├── .env.example               # Template biến môi trường
├── requirements.txt           # Python dependencies
│
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql   # Schema PostgreSQL (15 bảng)
│       ├── 002_rls_policies.sql    # Row Level Security
│       └── 003_seed_data.sql       # Dữ liệu khởi tạo
│
├── backend/
│   └── services/
│       ├── supabase_client.py      # Supabase client singleton
│       └── cloudflare_r2.py        # Cloudflare R2 integration
│
└── frontend/
    └── index.html                  # Landing page (placeholder)
```

## 🚀 Bắt đầu nhanh

### 1. Thiết lập Supabase

1. Tạo project tại [app.supabase.com](https://app.supabase.com)
2. Vào **SQL Editor** → chạy lần lượt 3 file migration:
   - `001_create_tables.sql`
   - `002_rls_policies.sql`
   - `003_seed_data.sql`
3. Lấy **API URL** và **Keys** từ Project Settings → API

### 2. Thiết lập Cloudflare R2

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Tạo bucket: `sentranghub-media`
3. Tạo R2 API Token (read/write)
4. (Tùy chọn) Kết nối Custom Domain cho public access

### 3. Cấu hình biến môi trường

```bash
cp .env.example .env
# Điền thông tin Supabase, Cloudflare R2
```

### 4. Cài đặt & Chạy Backend

```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

### 5. Deploy lên Vercel

```bash
npm i -g vercel
vercel --prod
```

## 🗂️ Database Schema (Supabase PostgreSQL)

| Bảng | Phân hệ | Mô tả |
|------|---------|-------|
| `users` | Quản trị | Tài khoản đăng nhập (linked Supabase Auth) |
| `roles` | Phân quyền | Vai trò & cấp bậc |
| `permissions` | Phân quyền | Registry permission keys |
| `role_permissions` | Phân quyền | Liên kết N-N roles ↔ permissions |
| `members` | Nhân sự | Hồ sơ thành viên |
| `position_history` | Nhân sự | Lịch sử chức vụ CLB |
| `external_positions` | Nhân sự | Chức vụ kiêm nhiệm ngoài CLB |
| `events` | Hoạt động | Sự kiện & cổng đăng ký |
| `event_sessions` | Hoạt động | Phiên điểm danh |
| `registrations` | Hoạt động | Đăng ký tham gia sự kiện |
| `attendance` | Hoạt động | Bản ghi điểm danh |
| `articles` | Truyền thông | Bài viết CMS |
| `quizzes` | Đào tạo | Bài thi trắc nghiệm |
| `questions` | Đào tạo | Câu hỏi trắc nghiệm |
| `quiz_attempts` | Đào tạo | Kết quả thi |
| `activity_logs` | Hệ thống | Audit trail |
| `club_settings` | Hệ thống | Cấu hình chung |

## 🔐 Vai trò mặc định

| Level | Vai trò | Số quyền |
|-------|---------|----------|
| 0 | Super Admin | 27 (toàn quyền) |
| 1 | Chủ nhiệm | 16 |
| 2 | Phó Chủ nhiệm | 12 |
| 3 | Thủ quỹ | 3 |
| 3 | Trưởng ban | 9 |
| 10 | Thành viên | 5 |

## ⚠️ Bảo mật

- **KHÔNG** commit file `.env` lên GitHub
- Đổi mật khẩu Super Admin ngay sau khi khởi tạo
- Sử dụng `SUPABASE_SERVICE_ROLE_KEY` chỉ ở backend
- Frontend chỉ dùng `SUPABASE_ANON_KEY`

## 📝 License

Private — Dành riêng cho CLB Thanh niên Tình nguyện Sen Trắng.
