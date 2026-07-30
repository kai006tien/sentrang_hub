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
    { id: 'admin_uid', email: 'admin@sentranghub.vn', display_name: 'Admin Hệ Thống', role_id: 'role_super_admin', role_name: 'Super Admin', role_level: 0, is_active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'user_001', email: 'an.nguyen@sentranghub.vn', display_name: 'Nguyễn Văn An', role_id: 'role_chu_nhiem', role_name: 'Chủ nhiệm', role_level: 1, is_active: true, created_at: '2025-09-01T00:00:00Z' },
    { id: 'user_002', email: 'binh.tran@sentranghub.vn', display_name: 'Trần Thị Bình', role_id: 'role_pho_chu_nhiem', role_name: 'Phó Chủ nhiệm', role_level: 2, is_active: true, created_at: '2025-09-01T00:00:00Z' },
    { id: 'user_003', email: 'cuong.le@sentranghub.vn', display_name: 'Lê Hoàng Cường', role_id: 'role_truong_ban', role_name: 'Trưởng ban', role_level: 3, is_active: true, created_at: '2025-09-01T00:00:00Z' },
    { id: 'user_004', email: 'duc.pham@sentranghub.vn', display_name: 'Phạm Minh Đức', role_id: 'role_thanh_vien', role_name: 'Thành viên', role_level: 10, is_active: true, created_at: '2026-03-01T00:00:00Z' },
    { id: 'user_005', email: 'huong.vo@sentranghub.vn', display_name: 'Võ Thị Mai Hương', role_id: 'role_thanh_vien', role_name: 'Thành viên', role_level: 10, is_active: false, created_at: '2025-06-01T00:00:00Z' }
  ],
  members: [
    { id: 'mem_001', full_name: 'Nguyễn Văn An', email: 'an.nguyen@sentranghub.vn', student_id: '2026001', generation: 'Gen 12', department: 'Ban Phong trào', current_position: 'Chủ nhiệm', status: 'active', user_id: 'user_001' },
    { id: 'mem_002', full_name: 'Trần Thị Bình', email: 'binh.tran@sentranghub.vn', student_id: '2026002', generation: 'Gen 12', department: 'Ban Truyền thông', current_position: 'Phó Chủ nhiệm', status: 'active', user_id: 'user_002' },
    { id: 'mem_003', full_name: 'Lê Hoàng Cường', email: 'cuong.le@sentranghub.vn', student_id: '2026003', generation: 'Gen 11', department: 'Ban Chuyên môn', current_position: 'Trưởng ban', status: 'active', user_id: 'user_003' },
    { id: 'mem_004', full_name: 'Phạm Minh Đức', email: 'duc.pham@sentranghub.vn', student_id: '2026004', generation: 'Gen 12', department: 'Ban Phong trào', current_position: 'Thành viên', status: 'active', user_id: 'user_004' },
    { id: 'mem_005', full_name: 'Võ Thị Mai Hương', email: 'huong.vo@sentranghub.vn', student_id: '2026005', generation: 'Gen 11', department: 'Ban Chủ nhiệm', current_position: 'Thư ký', status: 'inactive', user_id: 'user_005' }
  ],
  roles: [
    { id: 'role_super_admin', name: 'Super Admin', description: 'Quản trị viên cao nhất, toàn quyền hệ thống', level: 0, permissions: ['*'] },
    { id: 'role_chu_nhiem', name: 'Chủ nhiệm', description: 'Chủ nhiệm câu lạc bộ', level: 1, permissions: ['users.read', 'users.create', 'events.create', 'articles.create', 'articles.publish', 'quizzes.create', 'certificates.issue'] },
    { id: 'role_pho_chu_nhiem', name: 'Phó Chủ nhiệm', description: 'Phó Chủ nhiệm câu lạc bộ', level: 2, permissions: ['users.read', 'events.create', 'articles.create', 'articles.publish'] },
    { id: 'role_thu_quy', name: 'Thủ quỹ', description: 'Quản lý tài chính câu lạc bộ', level: 3, permissions: ['users.read'] },
    { id: 'role_truong_ban', name: 'Trưởng ban', description: 'Trưởng ban chuyên môn', level: 3, permissions: ['events.create', 'quizzes.create'] },
    { id: 'role_thanh_vien', name: 'Thành viên', description: 'Thành viên câu lạc bộ', level: 10, permissions: ['quizzes.take'] }
  ],
  events: [
    { id: 'event_001', title: 'Chiến dịch Mùa hè xanh 2026', description: 'Chiến dịch tình nguyện hè tại huyện Cần Giờ.', category: 'volunteer', location: 'Huyện Cần Giờ, TP.HCM', start_date: new Date().toISOString(), max_participants: 50, current_count: 42, base_points: 10, status: 'active' },
    { id: 'event_002', title: 'Workshop Kỹ năng Thuyết trình', description: 'Workshop rèn luyện kỹ năng giao tiếp.', category: 'training', location: 'Trường ĐH Bách Khoa TP.HCM', start_date: new Date().toISOString(), max_participants: 30, current_count: 18, base_points: 5, status: 'active' }
  ],
  articles: [
    { id: 'article_001', title: 'Sen Trắng — Hành trình 12 năm vì cộng đồng', excerpt: 'Nhìn lại chặng đường 12 năm hình thành và phát triển của CLB.', content: 'CLB Tình nguyện Sen Trắng chính thức thành lập năm 2014 với sứ mệnh kết nối và lan tỏa giá trị tình nguyện đến giới trẻ. Qua 12 năm hoạt động, CLB đã tổ chức hơn 200 chương trình tình nguyện, tiếp cận hơn 50.000 lượt thanh niên trên khắp các tỉnh thành phía Nam.', category: 'tin-tuc', status: 'published', image_url: '', author_name: 'Ban Truyền thông', view_count: 1250, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'article_002', title: 'Thông báo: Tuyển thành viên Gen 15', excerpt: 'CLB chính thức mở đợt tuyển thành viên Gen 15.', content: 'CLB Thanh niên Tình nguyện Sen Trắng thông báo tuyển thành viên Gen 15 cho nhiệm kỳ 2026–2027. Các bạn sinh viên có đam mê hoạt động tình nguyện, sẵn sàng cống hiến vì cộng đồng, hãy đăng ký tham gia!', category: 'thong-bao', status: 'published', image_url: '', author_name: 'Ban Chủ nhiệm', view_count: 420, created_at: new Date(Date.now() - 3600000).toISOString() }
  ],
  quizzes: [
    { id: 'quiz_001', title: 'Kiểm tra kiến thức tình nguyện viên 2026', description: 'Bài kiểm tra đánh giá kiến thức cơ bản.', category: 'orientation', duration: 1800, passing_score: 70, issue_certificate: false, question_count: 2, questions: [
      { id: 'q1', question_text: 'CLB Sen Trắng được thành lập vào năm nào?', options: [{id:'a',text:'2012'},{id:'b',text:'2014',correct:true},{id:'c',text:'2016'},{id:'d',text:'2018'}] },
      { id: 'q2', question_text: 'Giá trị cốt lõi nào sau đây thuộc về CLB?', options: [{id:'a',text:'Tận tâm, Sáng tạo, Đoàn kết',correct:true},{id:'b',text:'Cạnh tranh, Tiên phong'},{id:'c',text:'Kỷ luật, Nghiêm túc'}] }
    ]}
  ],
  notifications: [
    { id: 'noti_001', title: 'Chào mừng đến với Sen Trắng Hub v2!', content: 'Hệ thống đã được nâng cấp với nhiều tính năng mới: Thi trực tuyến, Thông báo, Truyền thông CMS nâng cao.', type: 'info', target: 'all', created_by: 'Admin Hệ Thống', created_at: new Date().toISOString(), read_by: [] },
    { id: 'noti_002', title: 'Chiến dịch Mùa hè xanh 2026 sắp diễn ra!', content: 'Tất cả thành viên vui lòng đăng ký tham gia trước ngày 05/08/2026.', type: 'important', target: 'all', created_by: 'Admin Hệ Thống', created_at: new Date(Date.now() - 3600000).toISOString(), read_by: [] }
  ],
  leaderboard: [
    { id: 'mem_001', rank: 1, full_name: 'Nguyễn Văn An', generation: 'Gen 12', department: 'Ban Phong trào', total_points: 285 },
    { id: 'mem_002', rank: 2, full_name: 'Trần Thị Bình', generation: 'Gen 12', department: 'Ban Truyền thông', total_points: 240 },
    { id: 'mem_003', rank: 3, full_name: 'Lê Hoàng Cường', generation: 'Gen 11', department: 'Ban Chuyên môn', total_points: 195 },
    { id: 'mem_004', rank: 4, full_name: 'Phạm Minh Đức', generation: 'Gen 12', department: 'Ban Phong trào', total_points: 150 },
    { id: 'mem_005', rank: 5, full_name: 'Võ Thị Mai Hương', generation: 'Gen 11', department: 'Ban Chủ nhiệm', total_points: 120 }
  ]
};

function getMockApiResponse(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let body = {};
  if (options.body) {
    try { body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body; } catch {}
  }

  // Auth Login
  if (endpoint.includes('/auth/login') && method === 'POST') {
    const email = body.email || 'admin@sentranghub.vn';
    const isSuper = (email === 'admin@sentranghub.vn');
    const user = {
      id: isSuper ? 'admin_uid' : 'user_' + Date.now(),
      email: email,
      display_name: isSuper ? 'Admin Hệ Thống' : (email.split('@')[0] || 'Thành viên'),
      role_id: isSuper ? 'role_super_admin' : 'role_thanh_vien',
      role_name: isSuper ? 'Super Admin' : 'Thành viên',
      role_level: isSuper ? 0 : 10,
      is_active: true,
      permissions: isSuper ? ['*'] : ['quizzes.take', 'events.create', 'articles.create'],
      created_at: new Date().toISOString()
    };
    return Promise.resolve({
      access_token: 'demo_token_' + Date.now(),
      refresh_token: 'demo_refresh_' + Date.now(),
      expires_in: 86400,
      user: user
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
    const newUser = { id: 'user_' + Date.now(), ...body, is_active: true, created_at: new Date().toISOString() };
    MOCK_DB.users.push(newUser);
    return Promise.resolve({ message: `Tạo tài khoản "${body.display_name}" thành công!`, data: newUser });
  }
  if (endpoint.includes('/users/') && endpoint.includes('/role') && method === 'PUT') {
    const userId = endpoint.split('/')[3];
    const user = MOCK_DB.users.find(u => u.id === userId);
    if (user) { user.role_id = body.role_id; }
    return Promise.resolve({ message: 'Cập nhật vai trò thành công!' });
  }
  if (endpoint.startsWith('/api/users')) return Promise.resolve(MOCK_DB.users);

  // Roles
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
