/**
 * Sen Trắng Hub v2 — Full-Stack Node.js Server & API
 * Port: 3000
 * Features: Demo auth fallback, in-memory user store, full CRUD APIs
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'frontend');

// Supabase Credentials
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8', '.css': 'text/css',
  '.js': 'application/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff'
};

// =====================================================================
// IN-MEMORY DATA STORE (persists per server session)
// =====================================================================
const demoUsers = [
  { id: 'admin_uid', email: 'admin@sentranghub.vn', password: 'SenTrang@2026!', display_name: 'Admin Hệ Thống', role_id: 'role_super_admin', role_name: 'Super Admin', role_level: 0, is_active: true, permissions: ['*'], created_at: '2026-01-01T00:00:00Z' },
  { id: 'user_001', email: 'an.nguyen@sentranghub.vn', password: 'User@2026!', display_name: 'Nguyễn Văn An', role_id: 'role_chu_nhiem', role_name: 'Chủ nhiệm', role_level: 1, is_active: true, permissions: ['users.read', 'events.create', 'articles.create', 'quizzes.create', 'certificates.issue'], created_at: '2025-09-01T00:00:00Z' },
  { id: 'user_002', email: 'binh.tran@sentranghub.vn', password: 'User@2026!', display_name: 'Trần Thị Bình', role_id: 'role_pho_chu_nhiem', role_name: 'Phó Chủ nhiệm', role_level: 2, is_active: true, permissions: ['users.read', 'events.create', 'articles.create'], created_at: '2025-09-01T00:00:00Z' },
  { id: 'user_003', email: 'cuong.le@sentranghub.vn', password: 'User@2026!', display_name: 'Lê Hoàng Cường', role_id: 'role_truong_ban', role_name: 'Trưởng ban', role_level: 3, is_active: true, permissions: ['events.create', 'quizzes.create'], created_at: '2025-09-01T00:00:00Z' },
  { id: 'user_004', email: 'duc.pham@sentranghub.vn', password: 'User@2026!', display_name: 'Phạm Minh Đức', role_id: 'role_thanh_vien', role_name: 'Thành viên', role_level: 10, is_active: true, permissions: ['quizzes.take'], created_at: '2026-03-01T00:00:00Z' },
  { id: 'user_005', email: 'huong.vo@sentranghub.vn', password: 'User@2026!', display_name: 'Võ Thị Mai Hương', role_id: 'role_thanh_vien', role_name: 'Thành viên', role_level: 10, is_active: false, permissions: ['quizzes.take'], created_at: '2025-06-01T00:00:00Z' }
];

const demoMembers = [
  { id: 'mem_001', full_name: 'Nguyễn Văn An', email: 'an.nguyen@sentranghub.vn', student_id: 'MSTN2026001', department: 'Ban Chủ nhiệm', current_position: 'Chủ nhiệm', status: 'active', user_id: 'user_001' },
  { id: 'mem_002', full_name: 'Trần Thị Bình', email: 'binh.tran@sentranghub.vn', student_id: 'MSTN2026002', department: 'Ban Chủ nhiệm', current_position: 'Phó Chủ nhiệm Thường trực', status: 'active', user_id: 'user_002' },
  { id: 'mem_003', full_name: 'Lê Hoàng Cường', email: 'cuong.le@sentranghub.vn', student_id: 'MSTN2026003', department: 'Ban Điều hành', current_position: 'Phó Chủ nhiệm', status: 'active', user_id: 'user_003' },
  { id: 'mem_004', full_name: 'Phạm Minh Đức', email: 'duc.pham@sentranghub.vn', student_id: 'MSTN2026004', department: 'Ban Thư ký', current_position: 'Thư ký', status: 'active', user_id: 'user_004' },
  { id: 'mem_005', full_name: 'Võ Thị Mai Hương', email: 'huong.vo@sentranghub.vn', student_id: 'MSTN2026005', department: 'Ban Công tác Hoạt động', current_position: 'Thành viên', status: 'inactive', user_id: 'user_005' }
];

const demoRoles = [
  { id: 'role_super_admin', name: 'Super Admin', description: 'Quản trị viên cao nhất, toàn quyền hệ thống', level: 0, permissions: ['*'] },
  { id: 'role_chu_nhiem', name: 'Chủ nhiệm', description: 'Chủ nhiệm câu lạc bộ', level: 1, permissions: ['users.read', 'users.create', 'users.update', 'users.delete', 'roles.manage', 'events.read', 'events.create', 'attendance.manage', 'articles.read', 'articles.create', 'articles.publish', 'quizzes.take', 'quizzes.create', 'certificates.view', 'certificates.issue', 'notifications.create'] },
  { id: 'role_pcn_thuong_truc', name: 'Phó Chủ nhiệm Thường trực', description: 'Phó Chủ nhiệm Thường trực câu lạc bộ', level: 1, permissions: ['users.read', 'users.create', 'users.update', 'events.read', 'events.create', 'attendance.manage', 'articles.read', 'articles.create', 'articles.publish', 'quizzes.take', 'quizzes.create', 'certificates.view', 'certificates.issue'] },
  { id: 'role_pho_chu_nhiem', name: 'Phó Chủ nhiệm', description: 'Phó Chủ nhiệm câu lạc bộ', level: 2, permissions: ['users.read', 'events.read', 'events.create', 'attendance.manage', 'articles.read', 'articles.create', 'articles.publish', 'quizzes.take', 'certificates.view'] },
  { id: 'role_uy_vien_bcn', name: 'Ủy viên Ban Chủ nhiệm', description: 'Ủy viên Ban Chủ nhiệm câu lạc bộ', level: 3, permissions: ['users.read', 'events.read', 'events.create', 'quizzes.take', 'certificates.view'] },
  { id: 'role_thu_ky', name: 'Thư ký', description: 'Thư ký câu lạc bộ', level: 3, permissions: ['users.read', 'articles.read', 'articles.create', 'notifications.create', 'certificates.view'] },
  { id: 'role_thu_quy', name: 'Thủ quỹ', description: 'Thủ quỹ quản lý tài chính', level: 3, permissions: ['users.read', 'certificates.view'] },
  { id: 'role_thanh_vien', name: 'Thành viên', description: 'Thành viên chính thức câu lạc bộ', level: 10, permissions: ['quizzes.take', 'events.read', 'articles.read', 'certificates.view'] },
  { id: 'role_cong_tac_vien', name: 'Cộng tác viên', description: 'Cộng tác viên câu lạc bộ', level: 10, permissions: ['events.read', 'articles.read'] }
];

const demoEvents = [
  { id: 'event_001', title: 'Chiến dịch Mùa hè xanh 2026', description: 'Chiến dịch tình nguyện hè tại huyện Cần Giờ.', category: 'volunteer', location: 'Huyện Cần Giờ, TP.HCM', start_date: new Date().toISOString(), max_participants: 50, current_count: 42, base_points: 10, status: 'active' },
  { id: 'event_002', title: 'Workshop Kỹ năng Thuyết trình', description: 'Workshop rèn luyện kỹ năng giao tiếp.', category: 'training', location: 'Trường ĐH Bách Khoa TP.HCM', start_date: new Date().toISOString(), max_participants: 30, current_count: 18, base_points: 5, status: 'active' }
];

const demoArticles = [
  { id: 'article_001', title: 'Sen Trắng — Hành trình 12 năm vì cộng đồng', excerpt: 'Nhìn lại chặng đường 12 năm hình thành và phát triển của CLB.', content: 'CLB Tình nguyện Sen Trắng chính thức thành lập năm 2014 với sứ mệnh kết nối và lan tỏa giá trị tình nguyện đến giới trẻ. Qua 12 năm hoạt động, CLB đã tổ chức hơn 200 chương trình tình nguyện, tiếp cận hơn 50.000 lượt thanh niên trên khắp các tỉnh thành phía Nam.', category: 'tin-tuc', status: 'published', image_url: '', author_name: 'Ban Truyền thông', view_count: 1250, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'article_002', title: 'Thông báo: Tuyển thành viên nhiệm kỳ mới', excerpt: 'CLB chính thức mở đợt tuyển thành viên.', content: 'CLB Thanh niên Tình nguyện Sen Trắng thông báo tuyển thành viên cho nhiệm kỳ 2026–2027.', category: 'thong-bao', status: 'published', image_url: '', author_name: 'Ban Chủ nhiệm', view_count: 420, created_at: new Date(Date.now() - 3600000).toISOString() }
];

const demoQuizzes = [
  { id: 'quiz_001', title: 'Kiểm tra kiến thức tình nguyện viên 2026', description: 'Bài kiểm tra đánh giá kiến thức cơ bản.', category: 'orientation', duration: 1800, passing_score: 70, issue_certificate: false, questions: [
    { id: 'q1', question_text: 'CLB Sen Trắng được thành lập vào năm nào?', options: [{id:'a',text:'2012'},{id:'b',text:'2014',correct:true},{id:'c',text:'2016'},{id:'d',text:'2018'}] },
    { id: 'q2', question_text: 'Giá trị cốt lõi nào sau đây thuộc về CLB?', options: [{id:'a',text:'Tận tâm, Sáng tạo, Đoàn kết',correct:true},{id:'b',text:'Cạnh tranh, Tiên phong'},{id:'c',text:'Kỷ luật, Nghiêm túc'}] }
  ]}
];

const demoNotifications = [
  { id: 'noti_001', title: 'Chào mừng đến với Sen Trắng Hub v2!', content: 'Hệ thống đã được nâng cấp với nhiều tính năng mới: Thi trực tuyến, Thông báo, Truyền thông CMS nâng cao.', type: 'info', target: 'all', created_by: 'Admin Hệ Thống', created_at: new Date().toISOString(), read_by: [] },
  { id: 'noti_002', title: 'Chiến dịch Mùa hè xanh 2026 sắp diễn ra!', content: 'Tất cả thành viên vui lòng đăng ký tham gia trước ngày 05/08/2026.', type: 'important', target: 'all', created_by: 'Admin Hệ Thống', created_at: new Date(Date.now() - 3600000).toISOString(), read_by: [] }
];

const demoLeaderboard = [
  { id: 'mem_001', rank: 1, full_name: 'Nguyễn Văn An', department: 'Ban Chủ nhiệm', total_points: 285 },
  { id: 'mem_002', rank: 2, full_name: 'Trần Thị Bình', department: 'Ban Chủ nhiệm', total_points: 240 },
  { id: 'mem_003', rank: 3, full_name: 'Lê Hoàng Cường', department: 'Ban Điều hành', total_points: 195 },
  { id: 'mem_004', rank: 4, full_name: 'Phạm Minh Đức', department: 'Ban Thư ký', total_points: 150 },
  { id: 'mem_005', rank: 5, full_name: 'Võ Thị Mai Hương', department: 'Ban Công tác Hoạt động', total_points: 120 }
];

const demoCertificates = [];

const demoLogs = [
  { timestamp: new Date().toLocaleString('vi-VN'), admin: 'Super Admin', action: 'SYS.LOGIN', module: 'Hệ thống', detail: 'Đăng nhập thành công vào hệ thống' },
  { timestamp: new Date(Date.now() - 1800000).toLocaleString('vi-VN'), admin: 'Super Admin', action: 'USER.PERM_UPDATE', module: 'Phân quyền', detail: 'Cập nhật phân quyền trực tiếp cho tài khoản an.nguyen@sentranghub.vn' },
  { timestamp: new Date(Date.now() - 3600000).toLocaleString('vi-VN'), admin: 'Chủ nhiệm', action: 'EVENT.CREATE', module: 'Sự kiện', detail: 'Tạo mới sự kiện Chiến dịch Mùa hè xanh 2026' }
];

// =====================================================================
// HELPER: Check if token is a demo/fallback token
// =====================================================================
function isDemoMode(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '');
  return !token || token.startsWith('demo_') || token.startsWith('fallback_');
}

function getUserFromToken(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '');
  // For demo tokens, find user by stored token mapping or return admin
  const user = demoUsers.find(u => u._token === token);
  return user || demoUsers[0]; // Default to admin
}

// =====================================================================
// SERVER
// =====================================================================
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // API Endpoints
  if (req.url.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {};
        const urlPath = req.url.split('?')[0]; // Strip query params

        // ========== AUTH ==========
        if (urlPath === '/api/auth/login' && req.method === 'POST') {
          const { email, password } = parsedBody;
          const user = demoUsers.find(u => u.email === email && u.password === password);
          if (user) {
            const token = 'demo_token_' + user.id + '_' + Date.now();
            user._token = token; // Store token mapping
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              access_token: token,
              refresh_token: 'demo_refresh_' + Date.now(),
              expires_in: 86400,
              user: { id: user.id, email: user.email, display_name: user.display_name, role_id: user.role_id, role_name: user.role_name, role_level: user.role_level, is_active: user.is_active, permissions: user.permissions, created_at: user.created_at }
            }));
          } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ detail: 'Email hoặc mật khẩu không chính xác.' }));
          }
          return;
        }

        if ((urlPath === '/api/auth/change-password' || urlPath === '/api/change-password') && req.method === 'POST') {
          const { old_password, current_password, new_password } = parsedBody;
          const oldPass = old_password || current_password;
          const user = getUserFromToken(req);
          if (!user) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ detail: 'Phiên làm việc hết hạn hoặc không hợp lệ!' }));
            return;
          }
          if (user.password && oldPass && user.password !== oldPass) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ detail: 'Mật khẩu hiện tại không chính xác!' }));
            return;
          }
          if (!new_password || new_password.trim().length < 6) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ detail: 'Mật khẩu mới phải có ít nhất 6 ký tự!' }));
            return;
          }
          user.password = new_password.trim();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Đổi mật khẩu thành công!' }));
          return;
        }

        // ========== USERS & PERMISSIONS ==========
        if (urlPath === '/api/users' && req.method === 'GET') {
          const users = demoUsers.map(u => ({
            id: u.id, email: u.email, display_name: u.display_name,
            role_id: u.role_id, role_name: u.role_name, role_level: u.role_level,
            is_active: u.is_active, permissions: u.permissions || [],
            created_at: u.created_at
          }));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(users));
          return;
        }

        if (urlPath === '/api/users/create-account' && req.method === 'POST') {
          const { email, password, display_name, role_id } = parsedBody;
          if (demoUsers.find(u => u.email === email)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ detail: 'Email đã tồn tại trong hệ thống!' }));
            return;
          }
          const role = demoRoles.find(r => r.id === role_id) || demoRoles[5];
          const newUser = {
            id: 'user_' + Date.now(),
            email, password: password || 'User@2026!',
            display_name: display_name || email.split('@')[0],
            role_id: role.id, role_name: role.name, role_level: role.level,
            is_active: true, permissions: [...role.permissions],
            created_at: new Date().toISOString()
          };
          demoUsers.push(newUser);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Tạo tài khoản "${newUser.display_name}" thành công! Vai trò: ${role.name}`, data: { id: newUser.id, email: newUser.email, display_name: newUser.display_name, role_name: role.name } }));
          return;
        }

        function checkAdminPermission(req, res) {
          const user = getUserFromToken(req);
          const isAdmin = user && (user.role_id === 'role_super_admin' || user.role_level === 0 || (user.permissions || []).includes('*') || (user.permissions || []).includes('roles.manage'));
          if (!isAdmin) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ detail: 'Chỉ Super Admin mới có quyền chỉnh sửa phân quyền hệ thống!' }));
            return false;
          }
          return true;
        }

        if (urlPath.match(/^\/api\/users\/[^/]+\/role$/) && req.method === 'PUT') {
          if (!checkAdminPermission(req, res)) return;
          const userId = urlPath.split('/')[3];
          const { role_id } = parsedBody;
          const user = demoUsers.find(u => u.id === userId);
          const role = demoRoles.find(r => r.id === role_id);
          if (!user) { res.writeHead(404, {'Content-Type':'application/json'}); res.end(JSON.stringify({detail:'User không tồn tại'})); return; }
          if (!role) { res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({detail:'Vai trò không hợp lệ'})); return; }
          user.role_id = role.id; user.role_name = role.name; user.role_level = role.level; user.permissions = [...role.permissions];
          demoLogs.unshift({ timestamp: new Date().toLocaleString('vi-VN'), admin: 'Super Admin', action: 'USER.ROLE_UPDATE', module: 'Phân quyền', detail: `Đã đổi vai trò thành ${role.name} cho ${user.display_name}` });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Đã cập nhật vai trò "${role.name}" cho ${user.display_name}!` }));
          return;
        }

        if (urlPath.match(/^\/api\/users\/[^/]+\/permissions$/) && req.method === 'PUT') {
          if (!checkAdminPermission(req, res)) return;
          const userId = urlPath.split('/')[3];
          const { role_id, permissions } = parsedBody;
          const user = demoUsers.find(u => u.id === userId);
          if (!user) { res.writeHead(404, {'Content-Type':'application/json'}); res.end(JSON.stringify({detail:'User không tồn tại'})); return; }
          if (role_id) {
            const role = demoRoles.find(r => r.id === role_id);
            if (role) { user.role_id = role.id; user.role_name = role.name; user.role_level = role.level; }
          }
          if (Array.isArray(permissions)) user.permissions = permissions;
          demoLogs.unshift({ timestamp: new Date().toLocaleString('vi-VN'), admin: 'Super Admin', action: 'USER.PERM_UPDATE', module: 'Phân quyền', detail: `Cập nhật ${user.permissions.length} quyền trực tiếp cho ${user.display_name} (${user.email})` });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Đã lưu phân quyền trực tiếp cho ${user.display_name}!`, data: user }));
          return;
        }

        // ========== ROLES ==========
        if (urlPath === '/api/roles/permissions/all') {
          const perms = [
            { id: 'users.create', module: 'users', description: 'Tạo tài khoản người dùng', group: 'Quản trị' },
            { id: 'users.read', module: 'users', description: 'Xem danh sách tài khoản', group: 'Quản trị' },
            { id: 'users.update', module: 'users', description: 'Cập nhật tài khoản', group: 'Quản trị' },
            { id: 'users.delete', module: 'users', description: 'Xóa tài khoản', group: 'Quản trị' },
            { id: 'roles.manage', module: 'roles', description: 'Quản lý vai trò & phân quyền', group: 'Quản trị' },
            { id: 'logs.view', module: 'roles', description: 'Xem nhật ký hệ thống', group: 'Quản trị' },
            { id: 'events.read', module: 'events', description: 'Xem sự kiện', group: 'Hoạt động' },
            { id: 'events.create', module: 'events', description: 'Tạo sự kiện mới', group: 'Hoạt động' },
            { id: 'attendance.manage', module: 'attendance', description: 'Quản lý điểm danh QR', group: 'Hoạt động' },
            { id: 'articles.read', module: 'articles', description: 'Xem bài viết', group: 'Truyền thông' },
            { id: 'articles.create', module: 'articles', description: 'Tạo bài viết mới', group: 'Truyền thông' },
            { id: 'articles.publish', module: 'articles', description: 'Xuất bản bài viết', group: 'Truyền thông' },
            { id: 'quizzes.take', module: 'quizzes', description: 'Làm bài thi trắc nghiệm', group: 'Thi trực tuyến' },
            { id: 'quizzes.create', module: 'quizzes', description: 'Tạo đề thi trắc nghiệm', group: 'Thi trực tuyến' },
            { id: 'certificates.view', module: 'certificates', description: 'Xem bảng xếp hạng & chứng nhận', group: 'Vinh danh' },
            { id: 'certificates.issue', module: 'certificates', description: 'Cấp giấy chứng nhận', group: 'Vinh danh' },
            { id: 'notifications.create', module: 'notifications', description: 'Tạo thông báo', group: 'Quản trị' }
          ];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(perms));
          return;
        }

        if (urlPath === '/api/roles' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(demoRoles));
          return;
        }

        if (urlPath.match(/^\/api\/roles\/[^/]+$/) && req.method === 'PUT') {
          if (!checkAdminPermission(req, res)) return;
          const roleId = urlPath.split('/').pop();
          const { permissions, description } = parsedBody;
          const role = demoRoles.find(r => r.id === roleId);
          if (role) {
            if (Array.isArray(permissions)) role.permissions = permissions;
            if (description) role.description = description;
            demoLogs.unshift({ timestamp: new Date().toLocaleString('vi-VN'), admin: 'Super Admin', action: 'ROLE.PERM_UPDATE', module: 'Phân quyền', detail: `Cập nhật quyền mặc định cho vai trò ${role.name}` });
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Cập nhật cấu hình vai trò thành công!', data: role }));
          return;
        }

        if (urlPath === '/api/logs' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(demoLogs));
          return;
        }

        // ========== MEMBERS ==========
        if (urlPath.match(/^\/api\/members\/[^/]+$/) && req.method === 'GET') {
          const memberId = urlPath.split('/').pop();
          const member = demoMembers.find(m => m.id === memberId) || demoMembers[0];
          const memberDetail = {
            profile: member,
            external_positions: [
              { position: 'Phó Bí thư Chi Đoàn', organization: 'Chi Đoàn Khoa CNTT - ĐH Bách Khoa' }
            ],
            position_history: [
              { role_id: 'Thành viên', start_date: '2024-09-01', end_date: '2025-03-01' },
              { role_id: member.current_position, start_date: '2025-03-01', end_date: null }
            ]
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ data: memberDetail }));
          return;
        }

        if (urlPath === '/api/members' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ data: demoMembers }));
          return;
        }

        if (urlPath.match(/^\/api\/members\/[^/]+$/) && req.method === 'PUT') {
          const memberId = urlPath.split('/').pop();
          const member = demoMembers.find(m => m.id === memberId);
          if (member) {
            Object.assign(member, parsedBody);
            if (parsedBody.password) {
              const usr = demoUsers.find(u => u.email === member.email || u.id === member.user_id);
              if (usr) usr.password = parsedBody.password;
            }
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Cập nhật thông tin thành viên thành công!', data: member }));
          return;
        }

        if (urlPath.match(/^\/api\/members\/[^/]+$/) && req.method === 'DELETE') {
          const memberId = urlPath.split('/').pop();
          const idx = demoMembers.findIndex(m => m.id === memberId);
          if (idx !== -1) { demoMembers.splice(idx, 1); }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Đã xóa thành viên thành công!' }));
          return;
        }

        if (urlPath === '/api/members' && req.method === 'POST') {
          const newMember = { id: 'mem_' + Date.now(), ...parsedBody, status: 'active' };
          demoMembers.push(newMember);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Tạo hồ sơ thành viên mới thành công!', data: newMember }));
          return;
        }

        // ========== CERTIFICATES & LEADERBOARD ==========
        if (urlPath === '/api/certificates/leaderboard' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ data: demoLeaderboard }));
          return;
        }

        if (urlPath === '/api/certificates' && req.method === 'POST') {
          const cert = {
            id: 'cert_' + Date.now(),
            certificate_id: 'CERT-STH-2026-' + String(Math.floor(Math.random() * 9000) + 1000),
            ...parsedBody,
            issued_date: new Date().toLocaleDateString('vi-VN'),
            created_at: new Date().toISOString()
          };
          demoCertificates.push(cert);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Cấp chứng nhận thành công!', certificate: cert }));
          return;
        }

        if (urlPath === '/api/certificates' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ data: demoCertificates }));
          return;
        }

        if (urlPath.match(/^\/api\/certificates\/[^/]+\/issue/) && req.method === 'GET') {
          const memberId = urlPath.split('/')[3];
          const member = demoMembers.find(m => m.id === memberId) || demoMembers[0];
          const lb = demoLeaderboard.find(l => l.id === memberId) || demoLeaderboard[0];
          const cert = {
            certificate_id: 'CERT-STH-2026-' + String(Math.floor(Math.random() * 9000) + 1000),
            title: 'GIẤY CHỨNG NHẬN THÀNH TÍCH XUẤT SẮC',
            recipient_name: member.full_name,
            department: member.department,
            reason: `Ghi nhận thành tích xuất sắc trong hoạt động tình nguyện vì cộng đồng, hoàn thành vượt mức chỉ tiêu Điểm thành tích và đóng góp tích cực vào sự phát triển của CLB Thanh niên Tình nguyện Sen Trắng năm 2026.`,
            total_points: lb.total_points,
            issued_date: new Date().toLocaleDateString('vi-VN'),
            issued_by: 'Ban Chủ nhiệm CLB Sen Trắng'
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ certificate: cert }));
          return;
        }

        // ========== EVENTS ==========
        if (urlPath.startsWith('/api/events')) {
          if (urlPath.includes('/attendance') && req.method === 'POST') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Điểm danh QR Code thành công! +10 Điểm thành tích.' }));
            return;
          }
          if (urlPath.includes('/check-in')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Điểm danh QR Code thành công! +10 Điểm thành tích.' }));
            return;
          }
          if (req.method === 'POST' && urlPath === '/api/events') {
            const user = getUserFromToken(req);
            const canCreate = user && (user.role_id === 'role_super_admin' || user.role_level === 0 || (user.permissions || []).includes('*') || (user.permissions || []).includes('events.create'));
            if (!canCreate) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ detail: 'Chỉ Admin và các User được phân quyền "Tạo sự kiện" mới được thực hiện!' }));
              return;
            }
            const newEvent = { id: 'event_' + Date.now(), ...parsedBody, current_count: 0, status: 'active', start_date: new Date().toISOString() };
            demoEvents.push(newEvent);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Tạo sự kiện mới thành công!', data: newEvent }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(demoEvents));
          return;
        }

        // ========== ARTICLES CMS ==========
        if (urlPath.startsWith('/api/articles')) {
          if (req.method === 'POST' && urlPath === '/api/articles') {
            const user = getUserFromToken(req);
            const canCreate = user && (user.role_id === 'role_super_admin' || user.role_level === 0 || (user.permissions || []).includes('*') || (user.permissions || []).includes('articles.create'));
            if (!canCreate) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ detail: 'Chỉ Admin và các User được phân quyền "Bài viết" mới được thực hiện!' }));
              return;
            }
            const newArticle = { id: 'article_' + Date.now(), ...parsedBody, status: 'published', view_count: 0, author_name: parsedBody.author_name || 'Ban Truyền thông', created_at: new Date().toISOString() };
            demoArticles.push(newArticle);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Tạo bài viết mới thành công!', data: newArticle }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(demoArticles));
          return;
        }

        // ========== QUIZZES ==========
        if (urlPath.startsWith('/api/quizzes')) {
          if (urlPath.match(/\/api\/quizzes\/[^/]+\/questions/) && req.method === 'GET') {
            const quizId = urlPath.split('/')[3];
            const quiz = demoQuizzes.find(q => q.id === quizId) || demoQuizzes[0];
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(quiz.questions || []));
            return;
          }
          if (urlPath.includes('/submit') && req.method === 'POST') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ total_points: 2, max_points: 2, score_percent: 100, correct_count: 2, incorrect_count: 0, passed: true, grade: 'A', message: 'Chúc mừng! Bạn ĐẠT điểm tối đa!' }));
            return;
          }
          if (req.method === 'POST' && urlPath === '/api/quizzes') {
            const newQuiz = { id: 'quiz_' + Date.now(), ...parsedBody, questions: parsedBody.questions || [] };
            demoQuizzes.push(newQuiz);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Tạo đề thi mới thành công!', data: newQuiz }));
            return;
          }
          const quizList = demoQuizzes.map(q => ({ id: q.id, title: q.title, description: q.description, category: q.category, duration: q.duration, passing_score: q.passing_score, issue_certificate: q.issue_certificate, question_count: (q.questions||[]).length }));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(quizList));
          return;
        }

        // ========== NOTIFICATIONS ==========
        if (urlPath === '/api/notifications' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ data: demoNotifications }));
          return;
        }

        if (urlPath === '/api/notifications' && req.method === 'POST') {
          const noti = { id: 'noti_' + Date.now(), ...parsedBody, created_at: new Date().toISOString(), read_by: [] };
          demoNotifications.unshift(noti);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Gửi thông báo thành công!', data: noti }));
          return;
        }

        if (urlPath.match(/^\/api\/notifications\/[^/]+\/read$/) && req.method === 'PUT') {
          const notiId = urlPath.split('/')[3];
          const noti = demoNotifications.find(n => n.id === notiId);
          if (noti) { const userId = parsedBody.user_id || 'admin_uid'; if (!noti.read_by.includes(userId)) noti.read_by.push(userId); }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Đã đánh dấu đã đọc' }));
          return;
        }

        // Generic fallback
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, c2) => {
          if (e2) { res.writeHead(500); res.end('Server Error'); }
          else { res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' }); res.end(c2, 'utf-8'); }
        });
      } else { res.writeHead(500); res.end(`Server Error: ${err.code}`); }
    } else {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🌸 Sen Trắng Hub v2 đang chạy tại: http://localhost:${PORT}`);
});
