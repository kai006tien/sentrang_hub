-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SEN TRẮNG HUB — Seed Data                                     ║
-- ║  Migration 003: Dữ liệu khởi tạo mặc định                     ║
-- ╚══════════════════════════════════════════════════════════════════╝


-- ═══════════════════════════════════════════════════════════════════
-- 1. ROLES — 6 vai trò mặc định
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.roles (id, name, description, level, color, icon, is_system) VALUES
    ('role_super_admin',   'Super Admin',    'Quản trị viên cao nhất, toàn quyền hệ thống',                   0,  '#E74C3C', 'shield',       TRUE),
    ('role_chu_nhiem',     'Chủ nhiệm',     'Chủ nhiệm câu lạc bộ',                                         1,  '#3498DB', 'crown',        TRUE),
    ('role_pho_chu_nhiem', 'Phó Chủ nhiệm', 'Phó Chủ nhiệm câu lạc bộ',                                     2,  '#2ECC71', 'shield-check', FALSE),
    ('role_thu_quy',       'Thủ quỹ',       'Quản lý tài chính câu lạc bộ',                                  3,  '#F39C12', 'wallet',       FALSE),
    ('role_truong_ban',    'Trưởng ban',     'Trưởng ban chuyên môn (Hoạt động, Truyền thông, Đào tạo...)',   3,  '#9B59B6', 'users',        FALSE),
    ('role_thanh_vien',    'Thành viên',     'Thành viên câu lạc bộ',                                         10, '#95A5A6', 'user',         TRUE);


-- ═══════════════════════════════════════════════════════════════════
-- 2. PERMISSIONS — 27 permission keys
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.permissions (id, module, action, description, "group") VALUES
    -- Quản trị
    ('users.create',      'users',      'create',    'Tạo tài khoản người dùng mới',              'Quản trị'),
    ('users.read',        'users',      'read',      'Xem danh sách tài khoản',                    'Quản trị'),
    ('users.update',      'users',      'update',    'Cập nhật tài khoản người dùng',              'Quản trị'),
    ('users.delete',      'users',      'delete',    'Xóa tài khoản người dùng',                   'Quản trị'),
    ('roles.manage',      'roles',      'manage',    'Quản lý vai trò và phân quyền',              'Quản trị'),
    -- Nhân sự
    ('members.create',    'members',    'create',    'Tạo hồ sơ thành viên mới',                   'Nhân sự'),
    ('members.read',      'members',    'read',      'Xem danh sách hồ sơ thành viên',             'Nhân sự'),
    ('members.read.self', 'members',    'read.self', 'Xem hồ sơ cá nhân của chính mình',           'Nhân sự'),
    ('members.update',    'members',    'update',    'Cập nhật hồ sơ thành viên',                  'Nhân sự'),
    ('members.delete',    'members',    'delete',    'Xóa hồ sơ thành viên',                       'Nhân sự'),
    -- Hoạt động
    ('events.create',     'events',     'create',    'Tạo sự kiện mới',                            'Hoạt động'),
    ('events.read',       'events',     'read',      'Xem danh sách sự kiện',                      'Hoạt động'),
    ('events.update',     'events',     'update',    'Cập nhật thông tin sự kiện',                  'Hoạt động'),
    ('events.delete',     'events',     'delete',    'Xóa sự kiện',                                'Hoạt động'),
    ('attendance.manage', 'attendance', 'manage',    'Quản lý điểm danh (tạo, sửa, xóa)',          'Hoạt động'),
    ('attendance.self',   'attendance', 'self',      'Tự điểm danh và xem lịch sử cá nhân',        'Hoạt động'),
    -- Truyền thông
    ('articles.create',   'articles',   'create',    'Tạo bài viết mới',                           'Truyền thông'),
    ('articles.read',     'articles',   'read',      'Xem bài viết (bao gồm draft/review)',        'Truyền thông'),
    ('articles.update',   'articles',   'update',    'Chỉnh sửa bài viết',                         'Truyền thông'),
    ('articles.delete',   'articles',   'delete',    'Xóa bài viết',                               'Truyền thông'),
    ('articles.publish',  'articles',   'publish',   'Xuất bản bài viết lên trang chủ',            'Truyền thông'),
    -- Đào tạo
    ('quizzes.create',    'quizzes',    'create',    'Tạo bài thi trắc nghiệm mới',                'Đào tạo'),
    ('quizzes.read',      'quizzes',    'read',      'Xem danh sách bài thi và kết quả',            'Đào tạo'),
    ('quizzes.update',    'quizzes',    'update',    'Cập nhật bài thi',                            'Đào tạo'),
    ('quizzes.delete',    'quizzes',    'delete',    'Xóa bài thi',                                'Đào tạo'),
    ('quizzes.take',      'quizzes',    'take',      'Làm bài thi trắc nghiệm',                    'Đào tạo'),
    -- Hệ thống
    ('settings.manage',   'settings',   'manage',    'Quản lý cấu hình hệ thống',                  'Hệ thống'),
    ('reports.view',      'reports',    'view',      'Xem báo cáo và thống kê',                    'Hệ thống');


-- ═══════════════════════════════════════════════════════════════════
-- 3. ROLE_PERMISSIONS — Gán quyền cho từng vai trò
-- ═══════════════════════════════════════════════════════════════════

-- Super Admin: toàn quyền
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'role_super_admin', id FROM public.permissions;

-- Chủ nhiệm
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    ('role_chu_nhiem', 'members.create'),  ('role_chu_nhiem', 'members.read'),    ('role_chu_nhiem', 'members.update'),
    ('role_chu_nhiem', 'events.create'),   ('role_chu_nhiem', 'events.read'),     ('role_chu_nhiem', 'events.update'),  ('role_chu_nhiem', 'events.delete'),
    ('role_chu_nhiem', 'attendance.manage'),
    ('role_chu_nhiem', 'articles.create'), ('role_chu_nhiem', 'articles.read'),   ('role_chu_nhiem', 'articles.update'), ('role_chu_nhiem', 'articles.publish'),
    ('role_chu_nhiem', 'quizzes.create'),  ('role_chu_nhiem', 'quizzes.read'),    ('role_chu_nhiem', 'quizzes.update'),
    ('role_chu_nhiem', 'reports.view');

-- Phó Chủ nhiệm
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    ('role_pho_chu_nhiem', 'members.read'),    ('role_pho_chu_nhiem', 'members.update'),
    ('role_pho_chu_nhiem', 'events.create'),   ('role_pho_chu_nhiem', 'events.read'),    ('role_pho_chu_nhiem', 'events.update'),
    ('role_pho_chu_nhiem', 'attendance.manage'),
    ('role_pho_chu_nhiem', 'articles.create'), ('role_pho_chu_nhiem', 'articles.read'),  ('role_pho_chu_nhiem', 'articles.update'),
    ('role_pho_chu_nhiem', 'quizzes.create'),  ('role_pho_chu_nhiem', 'quizzes.read'),
    ('role_pho_chu_nhiem', 'reports.view');

-- Thủ quỹ
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    ('role_thu_quy', 'members.read'),
    ('role_thu_quy', 'events.read'),
    ('role_thu_quy', 'reports.view');

-- Trưởng ban
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    ('role_truong_ban', 'members.read'),
    ('role_truong_ban', 'events.create'),   ('role_truong_ban', 'events.read'),    ('role_truong_ban', 'events.update'),
    ('role_truong_ban', 'attendance.manage'),
    ('role_truong_ban', 'articles.create'), ('role_truong_ban', 'articles.read'),
    ('role_truong_ban', 'quizzes.create'),  ('role_truong_ban', 'quizzes.read');

-- Thành viên
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    ('role_thanh_vien', 'members.read.self'),
    ('role_thanh_vien', 'events.read'),
    ('role_thanh_vien', 'attendance.self'),
    ('role_thanh_vien', 'articles.read'),
    ('role_thanh_vien', 'quizzes.take');


-- ═══════════════════════════════════════════════════════════════════
-- 4. CLUB_SETTINGS — Cấu hình hệ thống mặc định
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.club_settings (key, value) VALUES
    ('general', '{
        "clubName": "Câu lạc bộ Thanh niên Tình nguyện Sen Trắng",
        "clubNameShort": "Sen Trắng",
        "foundedYear": 2014,
        "logoUrl": "",
        "bannerUrl": "",
        "primaryColor": "#1B5E20",
        "secondaryColor": "#FFD54F",
        "contactEmail": "sentrang@gmail.com",
        "contactPhone": "",
        "facebookUrl": "",
        "instagramUrl": "",
        "websiteUrl": "",
        "address": "",
        "description": "Câu lạc bộ thanh niên tình nguyện trực thuộc Đoàn Thanh niên — Hội Sinh viên.",
        "currentTerm": "Nhiệm kỳ 2025-2026"
    }'::jsonb),
    ('scoring', '{
        "attendancePointsPerSession": 5,
        "lateAttendancePenalty": -2,
        "quizBonusMultiplier": 1.5,
        "maxBonusPoints": 50,
        "maxTotalPoints": 100,
        "scoringPeriod": "semester",
        "currentPeriod": "2026-HK1",
        "gradeThresholds": { "excellent": 90, "good": 75, "average": 60, "poor": 40 }
    }'::jsonb),
    ('registration', '{
        "defaultApprovalRequired": true,
        "autoAssignRole": "role_thanh_vien",
        "autoAssignDepartment": null,
        "welcomeMessage": "🌸 Chào mừng bạn đến với gia đình Sen Trắng!",
        "maxMembersPerGeneration": 100
    }'::jsonb),
    ('cloudflare_r2', '{
        "bucketName": "sentranghub-media",
        "publicUrl": "",
        "folders": {
            "avatars": "avatars/",
            "events": "events/",
            "articles": "articles/",
            "quizzes": "quizzes/",
            "club": "club/"
        }
    }'::jsonb);
