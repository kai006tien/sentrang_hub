-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SEN TRẮNG HUB — Row Level Security (RLS) Policies             ║
-- ║  Migration 002: Phân quyền bảo mật cấp dòng                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Bật RLS cho tất cả bảng
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_settings ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "users_select" ON public.users
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_insert" ON public.users
    FOR INSERT WITH CHECK (
        public.user_has_permission(auth.uid(), 'users.create')
        OR auth.uid() = id  -- Cho phép trigger tạo profile
    );

CREATE POLICY "users_update_self" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_admin" ON public.users
    FOR UPDATE USING (public.user_has_permission(auth.uid(), 'users.update'));

CREATE POLICY "users_delete" ON public.users
    FOR DELETE USING (public.user_has_permission(auth.uid(), 'users.delete'));


-- ═══════════════════════════════════════════════════════════════════
-- ROLES & PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "roles_select" ON public.roles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "roles_manage" ON public.roles
    FOR ALL USING (public.user_has_permission(auth.uid(), 'roles.manage'));

CREATE POLICY "permissions_select" ON public.permissions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "permissions_manage" ON public.permissions
    FOR ALL USING (public.get_user_role_level(auth.uid()) = 0);  -- Super Admin only

CREATE POLICY "role_permissions_select" ON public.role_permissions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "role_permissions_manage" ON public.role_permissions
    FOR ALL USING (public.user_has_permission(auth.uid(), 'roles.manage'));


-- ═══════════════════════════════════════════════════════════════════
-- MEMBERS
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "members_select_all" ON public.members
    FOR SELECT USING (
        public.user_has_permission(auth.uid(), 'members.read')
    );

CREATE POLICY "members_select_self" ON public.members
    FOR SELECT USING (
        id = public.get_user_member_id(auth.uid())
    );

CREATE POLICY "members_insert" ON public.members
    FOR INSERT WITH CHECK (
        public.user_has_permission(auth.uid(), 'members.create')
    );

CREATE POLICY "members_update_admin" ON public.members
    FOR UPDATE USING (
        public.user_has_permission(auth.uid(), 'members.update')
    );

CREATE POLICY "members_update_self" ON public.members
    FOR UPDATE USING (
        id = public.get_user_member_id(auth.uid())
    ) WITH CHECK (
        id = public.get_user_member_id(auth.uid())
    );

CREATE POLICY "members_delete" ON public.members
    FOR DELETE USING (
        public.user_has_permission(auth.uid(), 'members.delete')
    );

-- Position History & External Positions
CREATE POLICY "position_history_select" ON public.position_history
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "position_history_manage" ON public.position_history
    FOR ALL USING (public.user_has_permission(auth.uid(), 'members.update'));

CREATE POLICY "external_positions_select" ON public.external_positions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "external_positions_manage" ON public.external_positions
    FOR ALL USING (
        public.user_has_permission(auth.uid(), 'members.update')
        OR member_id = public.get_user_member_id(auth.uid())
    );


-- ═══════════════════════════════════════════════════════════════════
-- EVENTS & REGISTRATIONS
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "events_select" ON public.events
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "events_insert" ON public.events
    FOR INSERT WITH CHECK (public.user_has_permission(auth.uid(), 'events.create'));

CREATE POLICY "events_update" ON public.events
    FOR UPDATE USING (
        public.user_has_permission(auth.uid(), 'events.update')
        OR created_by = auth.uid()
    );

CREATE POLICY "events_delete" ON public.events
    FOR DELETE USING (public.user_has_permission(auth.uid(), 'events.delete'));

CREATE POLICY "event_sessions_select" ON public.event_sessions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "event_sessions_manage" ON public.event_sessions
    FOR ALL USING (public.user_has_permission(auth.uid(), 'events.update'));

CREATE POLICY "registrations_select" ON public.registrations
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "registrations_insert" ON public.registrations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "registrations_update" ON public.registrations
    FOR UPDATE USING (
        public.user_has_permission(auth.uid(), 'events.update')
        OR member_id = public.get_user_member_id(auth.uid())
    );


-- ═══════════════════════════════════════════════════════════════════
-- ATTENDANCE
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "attendance_select_admin" ON public.attendance
    FOR SELECT USING (public.user_has_permission(auth.uid(), 'attendance.manage'));

CREATE POLICY "attendance_select_self" ON public.attendance
    FOR SELECT USING (member_id = public.get_user_member_id(auth.uid()));

CREATE POLICY "attendance_insert" ON public.attendance
    FOR INSERT WITH CHECK (
        public.user_has_permission(auth.uid(), 'attendance.manage')
        OR member_id = public.get_user_member_id(auth.uid())
    );

CREATE POLICY "attendance_update" ON public.attendance
    FOR UPDATE USING (public.user_has_permission(auth.uid(), 'attendance.manage'));

CREATE POLICY "attendance_delete" ON public.attendance
    FOR DELETE USING (public.user_has_permission(auth.uid(), 'attendance.manage'));


-- ═══════════════════════════════════════════════════════════════════
-- ARTICLES
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "articles_select_published" ON public.articles
    FOR SELECT USING (status = 'published');         -- Public cho trang chủ

CREATE POLICY "articles_select_admin" ON public.articles
    FOR SELECT USING (public.user_has_permission(auth.uid(), 'articles.read'));

CREATE POLICY "articles_insert" ON public.articles
    FOR INSERT WITH CHECK (public.user_has_permission(auth.uid(), 'articles.create'));

CREATE POLICY "articles_update" ON public.articles
    FOR UPDATE USING (public.user_has_permission(auth.uid(), 'articles.update'));

CREATE POLICY "articles_delete" ON public.articles
    FOR DELETE USING (public.user_has_permission(auth.uid(), 'articles.delete'));


-- ═══════════════════════════════════════════════════════════════════
-- QUIZZES & QUESTIONS
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "quizzes_select" ON public.quizzes
    FOR SELECT USING (
        public.user_has_permission(auth.uid(), 'quizzes.read')
        OR public.user_has_permission(auth.uid(), 'quizzes.take')
    );

CREATE POLICY "quizzes_insert" ON public.quizzes
    FOR INSERT WITH CHECK (public.user_has_permission(auth.uid(), 'quizzes.create'));

CREATE POLICY "quizzes_update" ON public.quizzes
    FOR UPDATE USING (public.user_has_permission(auth.uid(), 'quizzes.update'));

CREATE POLICY "quizzes_delete" ON public.quizzes
    FOR DELETE USING (public.user_has_permission(auth.uid(), 'quizzes.delete'));

CREATE POLICY "questions_select" ON public.questions
    FOR SELECT USING (
        public.user_has_permission(auth.uid(), 'quizzes.read')
        OR public.user_has_permission(auth.uid(), 'quizzes.take')
    );

CREATE POLICY "questions_manage" ON public.questions
    FOR ALL USING (
        public.user_has_permission(auth.uid(), 'quizzes.create')
        OR public.user_has_permission(auth.uid(), 'quizzes.update')
    );

CREATE POLICY "quiz_attempts_select_admin" ON public.quiz_attempts
    FOR SELECT USING (public.user_has_permission(auth.uid(), 'quizzes.read'));

CREATE POLICY "quiz_attempts_select_self" ON public.quiz_attempts
    FOR SELECT USING (member_id = public.get_user_member_id(auth.uid()));

CREATE POLICY "quiz_attempts_insert" ON public.quiz_attempts
    FOR INSERT WITH CHECK (
        public.user_has_permission(auth.uid(), 'quizzes.take')
        AND member_id = public.get_user_member_id(auth.uid())
    );

CREATE POLICY "quiz_attempts_update_self" ON public.quiz_attempts
    FOR UPDATE USING (
        member_id = public.get_user_member_id(auth.uid())
        AND status = 'in_progress'
    );

CREATE POLICY "quiz_attempts_update_admin" ON public.quiz_attempts
    FOR UPDATE USING (public.user_has_permission(auth.uid(), 'quizzes.update'));


-- ═══════════════════════════════════════════════════════════════════
-- SYSTEM
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "activity_logs_select" ON public.activity_logs
    FOR SELECT USING (public.get_user_role_level(auth.uid()) <= 1);  -- Super Admin & Chủ nhiệm

CREATE POLICY "activity_logs_insert" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Không cho update/delete logs (immutable)

CREATE POLICY "club_settings_select" ON public.club_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "club_settings_manage" ON public.club_settings
    FOR ALL USING (public.user_has_permission(auth.uid(), 'settings.manage'));
