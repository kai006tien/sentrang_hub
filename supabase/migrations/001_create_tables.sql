-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SEN TRẮNG HUB — Supabase PostgreSQL Schema                    ║
-- ║  Migration 001: Khởi tạo toàn bộ bảng cho hệ thống             ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Bật extension cần thiết
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ═══════════════════════════════════════════════════════════════════
-- PHÂN HỆ 1: QUẢN TRỊ & PHÂN QUYỀN
-- ═══════════════════════════════════════════════════════════════════

-- ▸ Bảng ROLES — Vai trò trong hệ thống
CREATE TABLE public.roles (
    id          TEXT PRIMARY KEY,                -- VD: 'role_super_admin'
    name        TEXT NOT NULL,                   -- Tên vai trò
    description TEXT DEFAULT '',                 -- Mô tả
    level       INTEGER NOT NULL DEFAULT 10,     -- Cấp bậc (0 = cao nhất)
    color       TEXT DEFAULT '#95A5A6',          -- Mã màu HEX cho UI
    icon        TEXT DEFAULT 'user',             -- Tên icon (Lucide)
    is_system   BOOLEAN DEFAULT FALSE,           -- Vai trò hệ thống (không xóa được)
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ▸ Bảng PERMISSIONS — Registry tất cả permission keys
CREATE TABLE public.permissions (
    id          TEXT PRIMARY KEY,                -- VD: 'users.create'
    module      TEXT NOT NULL,                   -- Module liên quan
    action      TEXT NOT NULL,                   -- Hành động cụ thể
    description TEXT DEFAULT '',                 -- Mô tả quyền
    "group"     TEXT DEFAULT 'Khác'              -- Nhóm quyền trên UI
);

-- ▸ Bảng ROLE_PERMISSIONS — Liên kết N-N giữa roles và permissions
CREATE TABLE public.role_permissions (
    role_id       TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ▸ Bảng USERS — Tài khoản đăng nhập (liên kết Supabase Auth)
CREATE TABLE public.users (
    id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email         TEXT NOT NULL UNIQUE,
    display_name  TEXT NOT NULL,
    avatar_url    TEXT,                           -- URL ảnh đại diện (Cloudflare R2)
    phone_number  TEXT,
    role_id       TEXT NOT NULL REFERENCES public.roles(id) DEFAULT 'role_thanh_vien',
    member_id     UUID,                           -- FK → members (set sau khi tạo member)
    is_active     BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    created_by    UUID                            -- UUID người tạo
);

CREATE INDEX idx_users_role ON public.users(role_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_member ON public.users(member_id);


-- ═══════════════════════════════════════════════════════════════════
-- PHÂN HỆ 2: NHÂN SỰ
-- ═══════════════════════════════════════════════════════════════════

-- ▸ Bảng MEMBERS — Hồ sơ thành viên CLB
CREATE TABLE public.members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       TEXT NOT NULL,
    date_of_birth   DATE,
    gender          TEXT CHECK (gender IN ('male', 'female', 'other')),
    student_id      TEXT UNIQUE,                  -- MSTN - MÃ SỐ THANH NIÊN
    university      TEXT,
    faculty         TEXT,
    major           TEXT,
    class_code      TEXT,
    academic_year   TEXT,                          -- VD: '2022-2026'
    email           TEXT NOT NULL,
    phone_number    TEXT,
    address         TEXT,
    avatar_url      TEXT,                          -- Cloudflare R2

    -- Thông tin CLB
    join_date       DATE,
    generation      TEXT,                          -- VD: 'Gen 12'
    department      TEXT,                          -- Ban chuyên môn
    current_position TEXT REFERENCES public.roles(id),

    -- Điểm rèn luyện (auto-calculated)
    total_points       NUMERIC(8,2) DEFAULT 0,
    attendance_points  NUMERIC(8,2) DEFAULT 0,
    quiz_points        NUMERIC(8,2) DEFAULT 0,
    bonus_points       NUMERIC(8,2) DEFAULT 0,
    score_updated_at   TIMESTAMPTZ,

    status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'alumni')),
    tags            TEXT[] DEFAULT '{}',           -- Nhãn phân loại
    notes           TEXT DEFAULT '',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_members_status ON public.members(status);
CREATE INDEX idx_members_department ON public.members(department);
CREATE INDEX idx_members_generation ON public.members(generation);
CREATE INDEX idx_members_student_id ON public.members(student_id);
CREATE INDEX idx_members_total_points ON public.members(total_points DESC);

-- Cập nhật FK member_id trong users
ALTER TABLE public.users
    ADD CONSTRAINT fk_users_member
    FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;

-- ▸ Bảng POSITION_HISTORY — Lịch sử chức vụ trong CLB
CREATE TABLE public.position_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id   UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    role_id     TEXT NOT NULL REFERENCES public.roles(id),
    department  TEXT,
    start_date  DATE NOT NULL,
    end_date    DATE,                              -- NULL = đang đảm nhiệm
    note        TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_position_history_member ON public.position_history(member_id);

-- ▸ Bảng EXTERNAL_POSITIONS — Chức vụ kiêm nhiệm ngoài CLB
CREATE TABLE public.external_positions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id     UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    organization  TEXT NOT NULL,
    position      TEXT NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_external_positions_member ON public.external_positions(member_id);


-- ═══════════════════════════════════════════════════════════════════
-- PHÂN HỆ 3: HOẠT ĐỘNG
-- ═══════════════════════════════════════════════════════════════════

-- ▸ Bảng EVENTS — Sự kiện
CREATE TABLE public.events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT DEFAULT '',
    category        TEXT DEFAULT 'other' CHECK (category IN ('volunteer', 'training', 'social', 'meeting', 'other')),
    cover_image_url TEXT,                          -- Cloudflare R2

    location        TEXT,
    location_lat    DOUBLE PRECISION,
    location_lng    DOUBLE PRECISION,

    -- Lịch trình
    start_date          TIMESTAMPTZ NOT NULL,
    end_date            TIMESTAMPTZ,
    registration_open   TIMESTAMPTZ,
    registration_close  TIMESTAMPTZ,

    -- Cấu hình đăng ký
    max_participants     INTEGER DEFAULT 0,        -- 0 = không giới hạn
    current_count        INTEGER DEFAULT 0,
    is_registration_open BOOLEAN DEFAULT TRUE,
    requires_approval    BOOLEAN DEFAULT TRUE,
    form_fields          JSONB DEFAULT '[]',        -- [{name, label, type, required, options?}]

    -- Cấu hình điểm danh
    attendance_method    TEXT DEFAULT 'qr_code' CHECK (attendance_method IN ('qr_code', 'manual', 'face_recognition')),
    check_in_enabled     BOOLEAN DEFAULT TRUE,
    check_out_enabled    BOOLEAN DEFAULT FALSE,

    -- Tính điểm rèn luyện
    base_points          NUMERIC(6,2) DEFAULT 0,
    bonus_points         NUMERIC(6,2) DEFAULT 0,
    penalty_per_absence  NUMERIC(6,2) DEFAULT 0,
    auto_calculate       BOOLEAN DEFAULT TRUE,

    status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    visibility      TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'members_only', 'private')),
    organizer_id    UUID REFERENCES public.members(id),
    department_id   TEXT,
    tags            TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      UUID REFERENCES public.users(id)
);

CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_start_date ON public.events(start_date DESC);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_status_start ON public.events(status, start_date DESC);

-- ▸ Bảng EVENT_SESSIONS — Phiên điểm danh cho sự kiện
CREATE TABLE public.event_sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,                     -- VD: 'Ngày 1 - Sáng'
    date        DATE NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_sessions_event ON public.event_sessions(event_id);

-- ▸ Bảng REGISTRATIONS — Đăng ký tham gia sự kiện
CREATE TABLE public.registrations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    member_id       UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    member_name     TEXT NOT NULL,                  -- Denormalized

    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    form_data       JSONB DEFAULT '{}',             -- Dữ liệu form tùy chỉnh
    approved_by     UUID REFERENCES public.users(id),
    approved_at     TIMESTAMPTZ,
    rejected_reason TEXT,
    cancelled_at    TIMESTAMPTZ,
    cancellation_reason TEXT,

    registered_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, member_id)                    -- Mỗi member chỉ đăng ký 1 lần/event
);

CREATE INDEX idx_registrations_event ON public.registrations(event_id);
CREATE INDEX idx_registrations_member ON public.registrations(member_id);
CREATE INDEX idx_registrations_status ON public.registrations(event_id, status);

-- ▸ Bảng ATTENDANCE — Điểm danh
CREATE TABLE public.attendance (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    session_id      UUID NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
    member_id       UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    member_name     TEXT NOT NULL,

    -- Check-in
    check_in_time       TIMESTAMPTZ,
    check_in_method     TEXT CHECK (check_in_method IN ('qr_code', 'manual', 'face_recognition')),
    check_in_verified_by UUID REFERENCES public.users(id),
    check_in_lat        DOUBLE PRECISION,
    check_in_lng        DOUBLE PRECISION,
    check_in_device     TEXT,

    -- Check-out
    check_out_time      TIMESTAMPTZ,
    check_out_method    TEXT,
    check_out_device    TEXT,

    status          TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    note            TEXT DEFAULT '',
    points_earned   NUMERIC(6,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(session_id, member_id)                  -- Mỗi member chỉ điểm danh 1 lần/session
);

CREATE INDEX idx_attendance_event ON public.attendance(event_id);
CREATE INDEX idx_attendance_session ON public.attendance(session_id);
CREATE INDEX idx_attendance_member ON public.attendance(member_id);
CREATE INDEX idx_attendance_member_date ON public.attendance(member_id, created_at DESC);


-- ═══════════════════════════════════════════════════════════════════
-- PHÂN HỆ 4: TRUYỀN THÔNG (CMS MINI)
-- ═══════════════════════════════════════════════════════════════════

-- ▸ Bảng ARTICLES — Bài viết
CREATE TABLE public.articles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    excerpt         TEXT DEFAULT '',                -- Tóm tắt ngắn
    content         TEXT DEFAULT '',                -- Nội dung HTML
    content_format  TEXT DEFAULT 'html' CHECK (content_format IN ('html', 'markdown')),
    cover_image_url TEXT,                           -- Cloudflare R2
    gallery         TEXT[] DEFAULT '{}',            -- URLs ảnh gallery

    category        TEXT DEFAULT 'tin-tuc' CHECK (category IN ('tin-tuc', 'su-kien', 'bai-viet', 'thong-bao')),
    tags            TEXT[] DEFAULT '{}',

    -- Tác giả (denormalized)
    author_id       UUID REFERENCES public.members(id),
    author_name     TEXT,
    author_avatar   TEXT,

    -- SEO
    meta_title       TEXT,
    meta_description TEXT,
    keywords         TEXT[] DEFAULT '{}',

    status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    is_pinned       BOOLEAN DEFAULT FALSE,
    is_featured     BOOLEAN DEFAULT FALSE,
    view_count      INTEGER DEFAULT 0,

    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      UUID REFERENCES public.users(id)
);

CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_published ON public.articles(status, published_at DESC);
CREATE INDEX idx_articles_category ON public.articles(category, published_at DESC);
CREATE INDEX idx_articles_pinned ON public.articles(status, is_pinned DESC, published_at DESC);


-- ═══════════════════════════════════════════════════════════════════
-- PHÂN HỆ 5: ĐÀO TẠO (THI TRẮC NGHIỆM)
-- ═══════════════════════════════════════════════════════════════════

-- ▸ Bảng QUIZZES — Bài thi trắc nghiệm
CREATE TABLE public.quizzes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           TEXT NOT NULL,
    description     TEXT DEFAULT '',
    cover_image_url TEXT,                           -- Cloudflare R2
    category        TEXT DEFAULT 'training' CHECK (category IN ('orientation', 'training', 'assessment', 'fun')),

    -- Cấu hình
    duration             INTEGER NOT NULL DEFAULT 1800,    -- Giây (1800 = 30 phút)
    total_questions      INTEGER DEFAULT 0,
    passing_score        INTEGER DEFAULT 70,               -- Phần trăm
    max_attempts         INTEGER DEFAULT 1,                -- 0 = không giới hạn
    shuffle_questions    BOOLEAN DEFAULT TRUE,
    shuffle_options      BOOLEAN DEFAULT TRUE,
    show_result_immediately BOOLEAN DEFAULT TRUE,
    show_correct_answers BOOLEAN DEFAULT FALSE,
    allow_review         BOOLEAN DEFAULT TRUE,

    -- Lịch thi
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    is_scheduled    BOOLEAN DEFAULT FALSE,

    -- Điều kiện tham gia (JSONB linh hoạt)
    eligibility     JSONB DEFAULT '{"targetRoles":[],"targetDepartments":[],"targetGenerations":[],"isPublic":false}',

    -- Thống kê (auto-updated)
    total_attempts  INTEGER DEFAULT 0,
    average_score   NUMERIC(6,2) DEFAULT 0,
    pass_rate       NUMERIC(5,4) DEFAULT 0,          -- 0.0000 → 1.0000
    highest_score   NUMERIC(6,2) DEFAULT 0,
    lowest_score    NUMERIC(6,2) DEFAULT 0,

    status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      UUID REFERENCES public.users(id)
);

CREATE INDEX idx_quizzes_status ON public.quizzes(status);
CREATE INDEX idx_quizzes_category ON public.quizzes(category);

-- ▸ Bảng QUESTIONS — Câu hỏi trắc nghiệm
CREATE TABLE public.questions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id         UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    sort_order      INTEGER DEFAULT 0,
    question_text   TEXT NOT NULL,
    question_type   TEXT NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false')),
    options         JSONB NOT NULL DEFAULT '[]',    -- [{id, text, isCorrect}]
    explanation     TEXT DEFAULT '',
    points          NUMERIC(4,2) DEFAULT 1,
    difficulty      TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    image_url       TEXT,                           -- Cloudflare R2
    tags            TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_quiz ON public.questions(quiz_id);
CREATE INDEX idx_questions_order ON public.questions(quiz_id, sort_order);

-- ▸ Bảng QUIZ_ATTEMPTS — Kết quả thi
CREATE TABLE public.quiz_attempts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id         UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    quiz_title      TEXT NOT NULL,                   -- Denormalized
    member_id       UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    member_name     TEXT NOT NULL,                   -- Denormalized
    attempt_number  INTEGER DEFAULT 1,

    started_at      TIMESTAMPTZ DEFAULT NOW(),
    submitted_at    TIMESTAMPTZ,
    time_spent      INTEGER DEFAULT 0,               -- Giây

    -- Chi tiết câu trả lời (JSONB)
    answers         JSONB DEFAULT '[]',              -- [{questionId, selectedOptions[], isCorrect, pointsEarned}]

    -- Kết quả (auto-calculated)
    total_points     NUMERIC(8,2) DEFAULT 0,
    max_points       NUMERIC(8,2) DEFAULT 0,
    score_percent    NUMERIC(5,2) DEFAULT 0,
    correct_count    INTEGER DEFAULT 0,
    incorrect_count  INTEGER DEFAULT 0,
    unanswered_count INTEGER DEFAULT 0,
    passed           BOOLEAN DEFAULT FALSE,
    grade            TEXT,                            -- A, B, C, D, F

    status          TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timed_out')),
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_member ON public.quiz_attempts(member_id);
CREATE INDEX idx_quiz_attempts_score ON public.quiz_attempts(quiz_id, score_percent DESC);
CREATE INDEX idx_quiz_attempts_member_date ON public.quiz_attempts(member_id, submitted_at DESC);


-- ═══════════════════════════════════════════════════════════════════
-- HỆ THỐNG
-- ═══════════════════════════════════════════════════════════════════

-- ▸ Bảng ACTIVITY_LOGS — Audit trail
CREATE TABLE public.activity_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES public.users(id),
    user_name   TEXT NOT NULL,
    action      TEXT NOT NULL,                     -- VD: 'member.create'
    module      TEXT NOT NULL,                     -- users | members | events | articles | quizzes | settings
    target_id   TEXT,                              -- ID đối tượng bị tác động
    target_type TEXT,                              -- user | member | event | article | quiz | role
    description TEXT DEFAULT '',
    metadata    JSONB DEFAULT '{}',                -- Dữ liệu bổ sung
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Không cho UPDATE/DELETE activity logs
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_module ON public.activity_logs(module, created_at DESC);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);

-- ▸ Bảng CLUB_SETTINGS — Cấu hình hệ thống
CREATE TABLE public.club_settings (
    key         TEXT PRIMARY KEY,                   -- VD: 'general', 'scoring', 'registration'
    value       JSONB NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_by  UUID REFERENCES public.users(id)
);


-- ═══════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

-- ▸ Tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER tr_members_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER tr_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER tr_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER tr_quizzes_updated_at
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ▸ Tự động tạo user profile khi đăng ký qua Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name, role_id, created_by)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        'role_thanh_vien',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ▸ Tự động cập nhật registration count
CREATE OR REPLACE FUNCTION public.update_registration_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved') THEN
        UPDATE public.events
        SET current_count = (
            SELECT COUNT(*) FROM public.registrations
            WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
            AND status = 'approved'
        )
        WHERE id = COALESCE(NEW.event_id, OLD.event_id);
    ELSIF TG_OP = 'UPDATE' AND NEW.status != 'approved' AND OLD.status = 'approved' THEN
        UPDATE public.events
        SET current_count = (
            SELECT COUNT(*) FROM public.registrations
            WHERE event_id = OLD.event_id AND status = 'approved'
        )
        WHERE id = OLD.event_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.events
        SET current_count = (
            SELECT COUNT(*) FROM public.registrations
            WHERE event_id = OLD.event_id AND status = 'approved'
        )
        WHERE id = OLD.event_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_registration_count
    AFTER INSERT OR UPDATE OR DELETE ON public.registrations
    FOR EACH ROW EXECUTE FUNCTION public.update_registration_count();

-- ▸ Function: Kiểm tra user có permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_uuid UUID, perm TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users u
        JOIN public.role_permissions rp ON rp.role_id = u.role_id
        WHERE u.id = user_uuid AND rp.permission_id = perm
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ▸ Function: Lấy role level của user
CREATE OR REPLACE FUNCTION public.get_user_role_level(user_uuid UUID)
RETURNS INTEGER AS $$
    SELECT r.level
    FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ▸ Function: Lấy member_id từ user
CREATE OR REPLACE FUNCTION public.get_user_member_id(user_uuid UUID)
RETURNS UUID AS $$
    SELECT member_id FROM public.users WHERE id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
