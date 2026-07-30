/**
 * Sen Trắng Hub v2 — API Wrapper, Toast, Permission System & Client Mock Fallback
 */

// Toast Notifications System
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || '•'}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// =====================================================================
// MOCK DATA PROVIDER FOR STATIC HOSTINGS (Vercel / GitHub Pages)
// =====================================================================
const MOCK_DB = {
  users: [
    { id: 'admin_uid', email: 'admin@sentranghub.vn', display_name: 'Admin Hệ Thống', role_id: 'role_super_admin', role_name: 'Super Admin', role_level: 0, is_active: true, created_at: '2026-01-01T00:00:00Z' }
  ],
  members: [],
  roles: [
    { id: 'role_super_admin', name: 'Super Admin', description: 'Quản trị viên cao nhất, toàn quyền hệ thống', level: 0, permissions: ['*'] },
    { id: 'role_chu_nhiem', name: 'Chủ nhiệm', description: 'Chủ nhiệm câu lạc bộ', level: 1, permissions: ['users.read', 'users.create', 'users.update', 'users.delete', 'roles.manage', 'events.read', 'events.create', 'attendance.manage', 'articles.read', 'articles.create', 'articles.publish', 'quizzes.take', 'quizzes.create', 'certificates.view', 'certificates.issue', 'notifications.create'] },
    { id: 'role_pcn_thuong_truc', name: 'Phó Chủ nhiệm Thường trực', description: 'Phó Chủ nhiệm Thường trực câu lạc bộ', level: 1, permissions: ['users.read', 'users.create', 'users.update', 'events.read', 'events.create', 'attendance.manage', 'articles.read', 'articles.create', 'articles.publish', 'quizzes.take', 'quizzes.create', 'certificates.view', 'certificates.issue'] },
    { id: 'role_pho_chu_nhiem', name: 'Phó Chủ nhiệm', description: 'Phó Chủ nhiệm câu lạc bộ', level: 2, permissions: ['users.read', 'events.read', 'events.create', 'attendance.manage', 'articles.read', 'articles.create', 'articles.publish', 'quizzes.take', 'certificates.view'] },
    { id: 'role_uy_vien_bcn', name: 'Ủy viên Ban Chủ nhiệm', description: 'Ủy viên Ban Chủ nhiệm câu lạc bộ', level: 3, permissions: ['users.read', 'events.read', 'events.create', 'quizzes.take', 'certificates.view'] },
    { id: 'role_thu_ky', name: 'Thư ký', description: 'Thư ký câu lạc bộ', level: 3, permissions: ['users.read', 'articles.read', 'articles.create', 'notifications.create', 'certificates.view'] },
    { id: 'role_thu_quy', name: 'Thủ quỹ', description: 'Thủ quỹ quản lý tài chính', level: 3, permissions: ['users.read', 'certificates.view'] },
    { id: 'role_thanh_vien', name: 'Thành viên', description: 'Thành viên chính thức câu lạc bộ', level: 10, permissions: ['quizzes.take', 'events.read', 'articles.read', 'certificates.view'] },
    { id: 'role_cong_tac_vien', name: 'Cộng tác viên', description: 'Cộng tác viên câu lạc bộ', level: 10, permissions: ['events.read', 'articles.read'] }
  ],
  events: [],
  articles: [],
  quizzes: [],
  notifications: [],
  leaderboard: [],
  certificates: [],
  logs: []
};

function getMockApiResponse(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let body = {};
  if (options.body) {
    try { body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body; } catch {}
  }

  // Real-Time Sync Endpoint Mock
  if (endpoint.includes('/sync') && method === 'GET') {
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const notis = MOCK_DB.notifications || [];
    const unread = notis.filter(n => !user || !n.read_by || !n.read_by.includes(user.id)).length;
    const latestNoti = notis[0] || null;
    const currentUserInDb = MOCK_DB.users.find(u => u.id === user?.id || u.email === user?.email);
    return Promise.resolve({
      timestamp: Date.now(),
      unread_notifications: unread,
      latest_notification: latestNoti,
      user_profile: currentUserInDb || user,
      total_members: (MOCK_DB.members || []).length,
      total_events: (MOCK_DB.events || []).length,
      total_logs: (MOCK_DB.logs || []).length
    });
  }

  // Auth Login
  if (endpoint.includes('/auth/login') && method === 'POST') {
    const email = body.email;
    const password = body.password;
    const user = MOCK_DB.users.find(u => u.email === email);

    if (!user) {
      return Promise.reject(new Error('Tài khoản không tồn tại trong hệ thống!'));
    }

    if (user.is_active === false) {
      return Promise.reject(new Error('Tài khoản này đã bị khóa hoặc ngưng hoạt động!'));
    }

    if (user.password && password && user.password !== password) {
      return Promise.reject(new Error('Mật khẩu không chính xác!'));
    }

    return Promise.resolve({
      access_token: 'demo_token_' + user.id + '_' + Date.now(),
      refresh_token: 'demo_refresh_' + Date.now(),
      expires_in: 86400,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role_id: user.role_id,
        role_name: user.role_name,
        role_level: user.role_level,
        is_active: user.is_active,
        permissions: user.permissions || [],
        created_at: user.created_at
      }
    });
  }

  // Auth Change Password
  if (endpoint.includes('/auth/change-password') && method === 'POST') {
    const oldPass = body.old_password || body.current_password;
    const newPass = body.new_password;
    const currentUser = Auth.getUser();
    if (currentUser && currentUser.password && oldPass && currentUser.password !== oldPass) {
      return Promise.reject(new Error('Mật khẩu hiện tại không chính xác!'));
    }
    if (currentUser && newPass) {
      currentUser.password = newPass;
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
    }
    return Promise.resolve({ success: true, message: 'Đổi mật khẩu thành công!' });
  }

  // Users
  if (endpoint.includes('/users/create-account') && method === 'POST') {
    const newUser = { id: 'user_' + Date.now(), ...body, permissions: ['quizzes.take'], is_active: true, created_at: new Date().toISOString() };
    MOCK_DB.users.push(newUser);
    return Promise.resolve({ message: `Tạo tài khoản "${body.display_name}" thành công!`, data: newUser });
  }
  if (endpoint.includes('/users/') && endpoint.includes('/permissions') && method === 'PUT') {
    if (typeof isSuperAdmin === 'function' && !isSuperAdmin() && typeof hasPermission === 'function' && !hasPermission('roles.manage')) {
      return Promise.reject(new Error('Chỉ Super Admin / Quản trị viên mới được phép chỉnh sửa phân quyền!'));
    }
    const userId = endpoint.split('/')[3];
    const user = MOCK_DB.users.find(u => u.id === userId);
    if (user) {
      if (body.role_id) {
        const role = MOCK_DB.roles.find(r => r.id === body.role_id);
        if (role) { user.role_id = role.id; user.role_name = role.name; user.role_level = role.level; }
      }
      if (Array.isArray(body.permissions)) user.permissions = body.permissions;
      MOCK_DB.logs.unshift({ timestamp: new Date().toLocaleString('vi-VN'), admin: 'Super Admin', action: 'USER.PERM_UPDATE', module: 'Phân quyền', detail: `Phân quyền trực tiếp cho ${user.display_name} (${user.permissions.length} quyền)` });
    }
    return Promise.resolve({ message: `Đã lưu phân quyền trực tiếp cho ${user ? user.display_name : 'User'}!`, data: user });
  }
  if (endpoint.includes('/users/') && endpoint.includes('/role') && method === 'PUT') {
    if (typeof isSuperAdmin === 'function' && !isSuperAdmin() && typeof hasPermission === 'function' && !hasPermission('roles.manage')) {
      return Promise.reject(new Error('Chỉ Super Admin / Quản trị viên mới được phép chỉnh sửa phân quyền!'));
    }
    const userId = endpoint.split('/')[3];
    const user = MOCK_DB.users.find(u => u.id === userId);
    if (user) { user.role_id = body.role_id; }
    return Promise.resolve({ message: 'Cập nhật vai trò thành công!' });
  }
  if (endpoint.startsWith('/api/users')) return Promise.resolve(MOCK_DB.users);

  // Roles
  if (endpoint.match(/\/roles\/[^/]+$/) && method === 'PUT') {
    if (typeof isSuperAdmin === 'function' && !isSuperAdmin() && typeof hasPermission === 'function' && !hasPermission('roles.manage')) {
      return Promise.reject(new Error('Chỉ Super Admin / Quản trị viên mới được phép chỉnh sửa phân quyền!'));
    }
    const roleId = endpoint.split('/').pop();
    const role = MOCK_DB.roles.find(r => r.id === roleId);
    if (role && Array.isArray(body.permissions)) role.permissions = body.permissions;
    return Promise.resolve({ message: 'Cập nhật cấu hình vai trò thành công!', data: role });
  }
  if (endpoint === '/api/logs' && method === 'GET') {
    return Promise.resolve(MOCK_DB.logs || []);
  }
  if (endpoint.includes('/roles/permissions/all')) {
    return Promise.resolve([
      { id: 'users.create', module: 'users', description: 'Tạo tài khoản người dùng', group: 'Quản trị' },
      { id: 'users.read', module: 'users', description: 'Xem danh sách tài khoản', group: 'Quản trị' },
      { id: 'roles.manage', module: 'roles', description: 'Quản lý vai trò & phân quyền', group: 'Quản trị' },
      { id: 'events.create', module: 'events', description: 'Tạo sự kiện mới', group: 'Hoạt động' },
      { id: 'articles.create', module: 'articles', description: 'Tạo bài viết mới', group: 'Truyền thông' },
      { id: 'quizzes.create', module: 'quizzes', description: 'Tạo đề thi trắc nghiệm', group: 'Thi trực tuyến' },
      { id: 'certificates.issue', module: 'certificates', description: 'Cấp giấy chứng nhận', group: 'Vinh danh' },
      { id: 'notifications.create', module: 'notifications', description: 'Tạo thông báo', group: 'Quản trị' }
    ]);
  }
  if (endpoint.startsWith('/api/roles')) return Promise.resolve(MOCK_DB.roles);

  // Members
  if (endpoint.match(/\/members\/[^/]+$/) && method === 'PUT') {
    const memId = endpoint.split('/').pop();
    const mem = MOCK_DB.members.find(m => m.id === memId);
    if (mem) Object.assign(mem, body);
    return Promise.resolve({ message: 'Cập nhật thông tin thành công!', data: mem });
  }
  if (endpoint.match(/\/members\/[^/]+$/) && method === 'DELETE') {
    const memId = endpoint.split('/').pop();
    const idx = MOCK_DB.members.findIndex(m => m.id === memId);
    if (idx !== -1) MOCK_DB.members.splice(idx, 1);
    return Promise.resolve({ message: 'Xóa thành viên thành công!' });
  }
  if (endpoint.match(/\/members\/[^/]+$/) && method === 'GET') {
    const memId = endpoint.split('/').pop();
    const mem = MOCK_DB.members.find(m => m.id === memId) || MOCK_DB.members[0];
    return Promise.resolve({ data: { profile: mem, external_positions: [{ position: 'Phó Bí thư Chi Đoàn', organization: 'Chi Đoàn Khoa CNTT - ĐH Bách Khoa' }], position_history: [{ role_id: mem.current_position, start_date: '2025-01-01', end_date: null }] } });
  }
  if (endpoint === '/api/members' && method === 'POST') {
    const newMem = { id: 'mem_' + Date.now(), ...body, status: 'active' };
    MOCK_DB.members.push(newMem);
    return Promise.resolve({ message: 'Tạo thành viên mới thành công!', data: newMem });
  }
  if (endpoint.startsWith('/api/members')) return Promise.resolve({ data: MOCK_DB.members });

  // Leaderboard & Certificates
  if (endpoint.includes('/certificates/leaderboard')) return Promise.resolve({ data: MOCK_DB.leaderboard });
  if (endpoint.includes('/certificates/') && endpoint.includes('/issue')) {
    const memId = endpoint.split('/')[3];
    const mem = MOCK_DB.members.find(m => m.id === memId) || MOCK_DB.members[0];
    return Promise.resolve({ certificate: { certificate_id: 'CERT-STH-2026-' + Math.floor(1000 + Math.random()*9000), title: 'GIẤY CHỨNG NHẬN THÀNH TÍCH XUẤT SẮC', recipient_name: mem.full_name, generation: mem.generation, department: mem.department, reason: 'Ghi nhận thành tích xuất sắc trong hoạt động tình nguyện vì cộng đồng năm 2026.', total_points: 285, issued_date: new Date().toLocaleDateString('vi-VN'), issued_by: 'Ban Chủ nhiệm CLB Sen Trắng' } });
  }
  if (endpoint === '/api/certificates' && method === 'POST') {
    return Promise.resolve({ message: 'Cấp chứng nhận thành công!' });
  }

  // Events
  if (endpoint.includes('/events/') && (endpoint.includes('/attendance') || endpoint.includes('/check-in'))) {
    return Promise.resolve({ success: true, message: 'Điểm danh QR thành công! +10 Điểm thành tích.' });
  }
  if (endpoint === '/api/events' && method === 'POST') {
    const newEvt = { id: 'event_' + Date.now(), ...body, current_count: 0, status: 'active', start_date: new Date().toISOString() };
    MOCK_DB.events.push(newEvt);
    return Promise.resolve({ message: 'Tạo sự kiện mới thành công!', data: newEvt });
  }
  if (endpoint.startsWith('/api/events')) return Promise.resolve(MOCK_DB.events);

  // Articles
  if (endpoint === '/api/articles' && method === 'POST') {
    const newArt = { id: 'article_' + Date.now(), ...body, status: 'published', view_count: 0, author_name: 'Ban Truyền thông', created_at: new Date().toISOString() };
    MOCK_DB.articles.unshift(newArt);
    return Promise.resolve({ message: 'Tạo bài viết mới thành công!', data: newArt });
  }
  if (endpoint.startsWith('/api/articles')) return Promise.resolve(MOCK_DB.articles);

  // Quizzes
  if (endpoint.match(/\/quizzes\/[^/]+\/questions/)) return Promise.resolve(MOCK_DB.quizzes[0].questions);
  if (endpoint.includes('/quizzes/') && endpoint.includes('/submit')) return Promise.resolve({ total_points: 2, max_points: 2, score_percent: 100, correct_count: 2, passed: true, grade: 'A' });
  if (endpoint === '/api/quizzes' && method === 'POST') {
    const newQz = { id: 'quiz_' + Date.now(), ...body, question_count: (body.questions||[]).length };
    MOCK_DB.quizzes.push(newQz);
    return Promise.resolve({ message: 'Tạo đề thi mới thành công!', data: newQz });
  }
  if (endpoint.startsWith('/api/quizzes')) return Promise.resolve(MOCK_DB.quizzes);

  // Notifications
  if (endpoint.includes('/notifications/') && endpoint.includes('/read')) {
    return Promise.resolve({ message: 'Đã đánh dấu đã đọc' });
  }
  if (endpoint === '/api/notifications' && method === 'POST') {
    const noti = { id: 'noti_' + Date.now(), ...body, created_at: new Date().toISOString(), read_by: [] };
    MOCK_DB.notifications.unshift(noti);
    return Promise.resolve({ message: 'Gửi thông báo thành công!', data: noti });
  }
  if (endpoint.startsWith('/api/notifications')) return Promise.resolve({ data: MOCK_DB.notifications });

  return Promise.resolve({ status: 'ok' });
}

// Fetch API Wrapper
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${CONFIG.API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, { ...options, headers });
    const text = await response.text();

    // Check if response is HTML error page (<!DOCTYPE ...) from static hosting
    if (!response.ok || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      return getMockApiResponse(resolveEndpoint(endpoint), options);
    }

    try {
      return JSON.parse(text);
    } catch {
      return getMockApiResponse(resolveEndpoint(endpoint), options);
    }
  } catch (error) {
    console.warn(`[API Fallback] ${endpoint} failed, switching to client mock data:`, error.message);
    return getMockApiResponse(resolveEndpoint(endpoint), options);
  }
}

// Endpoint resolver
function resolveEndpoint(endpoint) {
  if (endpoint.startsWith('/api/')) return endpoint;
  return `/api${endpoint}`;
}

// API Object
const API = {
  get(endpoint) { return apiFetch(resolveEndpoint(endpoint), { method: 'GET' }); },
  post(endpoint, body) {
    return apiFetch(resolveEndpoint(endpoint), {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  },
  put(endpoint, body) {
    return apiFetch(resolveEndpoint(endpoint), {
      method: 'PUT',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  },
  delete(endpoint) { return apiFetch(resolveEndpoint(endpoint), { method: 'DELETE' }); }
};

// PERMISSION SYSTEM
function getCurrentUserPermissions() {
  const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
  if (!userData) return [];
  try {
    const user = JSON.parse(userData);
    return user.permissions || [];
  } catch { return []; }
}

function hasPermission(permission) {
  const perms = getCurrentUserPermissions();
  return perms.includes('*') || perms.includes(permission);
}

function isSuperAdmin() {
  const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
  if (!userData) return false;
  try {
    const user = JSON.parse(userData);
    return user.role_id === 'role_super_admin' || user.role_level === 0;
  } catch { return false; }
}

// Expose globals
window.showToast = showToast;
window.apiFetch = apiFetch;
window.API = API;
window.hasPermission = hasPermission;
window.isSuperAdmin = isSuperAdmin;
window.getCurrentUserPermissions = getCurrentUserPermissions;
