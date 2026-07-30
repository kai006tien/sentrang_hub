/**
 * Sen Trắng Hub v2 — API Wrapper, Toast, Permission System & Client Mock Fallback
 */

// Global HTML Escape Utility
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
    { id: 'admin_uid', email: 'admin@sentranghub.vn', password: 'SenTrang@2026!', display_name: 'Admin Hệ Thống', role_id: 'role_super_admin', role_name: 'Super Admin', role_level: 0, is_active: true, permissions: ['*'], created_at: '2026-01-01T00:00:00Z' }
  ],
  members: [
    { id: 'mem_01', user_id: 'admin_uid', full_name: 'Admin Hệ Thống', email: 'admin@sentranghub.vn', student_id: 'MSTN2026001', department: 'Ban Chủ nhiệm', current_position: 'Chủ nhiệm', status: 'active', total_points: 120, bonus_points: 40, attendance_points: 80, penalty_points: 0, points_history: [{ id: 'ph_init', event_id: 'event_01', title: 'Điểm danh: Chiến dịch Mùa Hè Tình Nguyện 2026', points: 10, type: 'attendance', date: new Date().toISOString() }] }
  ],
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
  events: [
    { id: 'event_01', title: 'Chiến dịch Mùa Hè Tình Nguyện 2026', category: 'volunteer', location: 'Huyện Hóc Môn, TP.HCM', start_date: '2026-07-20T08:00:00Z', max_participants: 50, current_count: 12, points_reward: 10, status: 'active' },
    { id: 'event_02', title: 'Tập huấn Kỹ năng Đội Nhóm & Sơ cứu', category: 'training', location: 'Hội trường B - Bách Khoa', start_date: '2026-07-25T14:00:00Z', max_participants: 40, current_count: 8, points_reward: 10, status: 'active' },
    { id: 'event_03', title: 'Sinh hoạt Định kỳ CLB Tháng 7', category: 'social', location: 'Phòng Sinh hoạt Sen Trắng', start_date: '2026-07-30T18:00:00Z', max_participants: 60, current_count: 15, points_reward: 10, status: 'active' }
  ],
  articles: [],
  quizzes: [],
  notifications: [],
  leaderboard: [],
  certificates: [],
  logs: []
};

const GLOBAL_CLOUD_DB_URL = 'https://jsonblob.com/api/jsonBlob/019fb1f2-890d-72b3-ae1d-621f05acd070';
let isCloudSyncing = false;
let mockDbVersion = Date.now();

// Cross-tab & multi-user Real-Time Synchronization Engine
const SYNC_CHANNEL_NAME = 'sentrang_hub_realtime_sync';
let syncChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    syncChannel.onmessage = (event) => {
      if (event.data && event.data.version) {
        if (event.data.version > mockDbVersion) {
          mockDbVersion = event.data.version;
          syncWithGlobalCloud().then(() => {
            if (typeof window.onRealtimeDataUpdated === 'function') {
              window.onRealtimeDataUpdated(event.data);
            }
          });
        }
      }
    };
  }
} catch (e) {
  console.warn('[Sync Channel] BroadcastChannel disabled:', e);
}

window.addEventListener('storage', (e) => {
  if (e.key === 'sentrang_last_broadcast_sync' && e.newValue) {
    try {
      const data = JSON.parse(e.newValue);
      if (data && data.version > mockDbVersion) {
        mockDbVersion = data.version;
        syncWithGlobalCloud().then(() => {
          if (typeof window.onRealtimeDataUpdated === 'function') {
            window.onRealtimeDataUpdated(data);
          }
        });
      }
    } catch {}
  }
});

function notifyRealtimeSync(eventType = 'DATA_UPDATED', payload = {}) {
  const syncEvent = {
    version: mockDbVersion,
    eventType: eventType,
    timestamp: Date.now(),
    payload: payload
  };
  if (syncChannel) {
    try { syncChannel.postMessage(syncEvent); } catch (e) {}
  }
  try {
    localStorage.setItem('sentrang_last_broadcast_sync', JSON.stringify(syncEvent));
  } catch (e) {}
  if (typeof window.onRealtimeDataUpdated === 'function') {
    window.onRealtimeDataUpdated(syncEvent);
  }
}

function ensureSeedData() {
  const seedEvents = [
    { id: 'event_01', title: 'Chiến dịch Mùa Hè Tình Nguyện 2026', category: 'volunteer', location: 'Huyện Hóc Môn, TP.HCM', start_date: '2026-07-20T08:00:00Z', max_participants: 50, current_count: 12, points_reward: 10, status: 'active' },
    { id: 'event_02', title: 'Tập huấn Kỹ năng Đội Nhóm & Sơ cứu', category: 'training', location: 'Hội trường B - Bách Khoa', start_date: '2026-07-25T14:00:00Z', max_participants: 40, current_count: 8, points_reward: 10, status: 'active' },
    { id: 'event_03', title: 'Sinh hoạt Định kỳ CLB Tháng 7', category: 'social', location: 'Phòng Sinh hoạt Sen Trắng', start_date: '2026-07-30T18:00:00Z', max_participants: 60, current_count: 15, points_reward: 10, status: 'active' }
  ];
  if (!Array.isArray(MOCK_DB.events) || MOCK_DB.events.length === 0) {
    MOCK_DB.events = seedEvents;
  }
  const seedMembers = [
    { id: 'mem_01', user_id: 'admin_uid', full_name: 'Admin Hệ Thống', email: 'admin@sentranghub.vn', student_id: 'MSTN2026001', department: 'Ban Chủ nhiệm', current_position: 'Chủ nhiệm', status: 'active', total_points: 120, bonus_points: 40, attendance_points: 80, penalty_points: 0, points_history: [{ id: 'ph_init', event_id: 'event_01', title: 'Điểm danh: Chiến dịch Mùa Hè Tình Nguyện 2026', points: 10, type: 'attendance', date: new Date().toISOString() }] }
  ];
  if (!Array.isArray(MOCK_DB.members) || MOCK_DB.members.length === 0) {
    MOCK_DB.members = seedMembers;
  }
}

async function syncWithGlobalCloud() {
  if (isCloudSyncing) return;
  isCloudSyncing = true;
  try {
    const res = await fetch(GLOBAL_CLOUD_DB_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.users) && data.users.length > 0) {
        if (data.version && data.version > mockDbVersion) mockDbVersion = data.version;
        MOCK_DB.users = data.users;
        if (Array.isArray(data.members)) MOCK_DB.members = data.members;
        if (Array.isArray(data.events)) MOCK_DB.events = data.events;
        if (Array.isArray(data.articles)) MOCK_DB.articles = data.articles;
        if (Array.isArray(data.quizzes)) MOCK_DB.quizzes = data.quizzes;
        if (Array.isArray(data.notifications)) MOCK_DB.notifications = data.notifications;
        if (Array.isArray(data.certificates)) MOCK_DB.certificates = data.certificates;
        if (Array.isArray(data.logs)) MOCK_DB.logs = data.logs;
        if (Array.isArray(data.years)) MOCK_DB.years = data.years;
        ensureSeedData();
        saveMockDbToStorage();
      }
    }
  } catch (e) {
    console.warn('[Global Cloud Sync] Offline fallback to localStorage cache:', e);
  } finally {
    isCloudSyncing = false;
  }
}

async function pushToGlobalCloud() {
  mockDbVersion = Date.now();
  ensureSeedData();
  saveMockDbToStorage();
  notifyRealtimeSync('CLOUD_PUSH', { version: mockDbVersion });
  try {
    await fetch(GLOBAL_CLOUD_DB_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        version: mockDbVersion,
        users: MOCK_DB.users,
        members: MOCK_DB.members,
        events: MOCK_DB.events,
        articles: MOCK_DB.articles,
        quizzes: MOCK_DB.quizzes,
        notifications: MOCK_DB.notifications,
        leaderboard: MOCK_DB.leaderboard,
        certificates: MOCK_DB.certificates,
        logs: MOCK_DB.logs,
        years: MOCK_DB.years
      })
    });
    console.log('[Global Cloud Sync] Database state pushed to cloud successfully.');
  } catch (e) {
    console.warn('[Global Cloud Sync] Push error, cached locally:', e);
  }
}

function loadMockDbFromStorage() {
  try {
    const savedUsers = localStorage.getItem('sentrang_db_users');
    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      if (Array.isArray(parsed) && parsed.length > 0) MOCK_DB.users = parsed;
    }
    const savedMembers = localStorage.getItem('sentrang_db_members');
    if (savedMembers) {
      const parsed = JSON.parse(savedMembers);
      if (Array.isArray(parsed) && parsed.length > 0) MOCK_DB.members = parsed;
    }
    const savedEvents = localStorage.getItem('sentrang_db_events');
    if (savedEvents) {
      const parsed = JSON.parse(savedEvents);
      if (Array.isArray(parsed) && parsed.length > 0) MOCK_DB.events = parsed;
    }
    const savedArticles = localStorage.getItem('sentrang_db_articles');
    if (savedArticles) {
      const parsed = JSON.parse(savedArticles);
      if (Array.isArray(parsed)) MOCK_DB.articles = parsed;
    }
    const savedCerts = localStorage.getItem('sentrang_db_certificates');
    if (savedCerts) {
      const parsed = JSON.parse(savedCerts);
      if (Array.isArray(parsed)) MOCK_DB.certificates = parsed;
    }
    ensureSeedData();
  } catch (e) {}
}

function saveMockDbToStorage() {
  try {
    localStorage.setItem('sentrang_db_users', JSON.stringify(MOCK_DB.users));
    localStorage.setItem('sentrang_db_members', JSON.stringify(MOCK_DB.members));
    localStorage.setItem('sentrang_db_events', JSON.stringify(MOCK_DB.events));
    localStorage.setItem('sentrang_db_articles', JSON.stringify(MOCK_DB.articles));
    localStorage.setItem('sentrang_db_certificates', JSON.stringify(MOCK_DB.certificates));
  } catch (e) {}
}

// Initial load from storage and background cloud sync
loadMockDbFromStorage();
syncWithGlobalCloud();

async function getMockApiResponse(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let body = {};
  if (options.body) {
    try { body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body; } catch {}
  }

  // Real-Time Sync Endpoint Mock
  if (endpoint.includes('/sync') && method === 'GET') {
    await syncWithGlobalCloud();
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const notis = MOCK_DB.notifications || [];
    const userNotis = notis.filter(n => {
      if (!user) return true;
      if (user.role_id === 'role_super_admin') return true;
      if (!n.target || n.target === 'all') return true;
      if (n.target === user.id || n.target === user.email || n.target === user.role_id) return true;
      if (n.user_id === user.id) return true;
      return false;
    });
    const unread = userNotis.filter(n => !user || !n.read_by || !n.read_by.includes(user.id)).length;
    const latestNoti = userNotis[0] || null;
    const currentUserInDb = MOCK_DB.users.find(u => u.id === user?.id || u.email === user?.email);
    return Promise.resolve({
      timestamp: mockDbVersion,
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
      const userInDb = MOCK_DB.users.find(u => u.id === currentUser.id || u.email === currentUser.email);
      if (userInDb) userInDb.password = newPass;
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
      pushToGlobalCloud();
    }
    return Promise.resolve({ success: true, message: 'Đổi mật khẩu thành công!' });
  }

  // Users
  if (endpoint.includes('/users/create-account') && method === 'POST') {
    const roleId = body.role_id || 'role_thanh_vien';
    const role = MOCK_DB.roles.find(r => r.id === roleId) || MOCK_DB.roles[7];
    const newUser = {
      id: 'user_' + Date.now(),
      email: body.email,
      password: body.password || 'User@2026!',
      display_name: body.display_name || body.email.split('@')[0],
      role_id: role.id,
      role_name: role.name,
      role_level: role.level,
      is_active: true,
      permissions: [...role.permissions],
      created_at: new Date().toISOString()
    };
    MOCK_DB.users = MOCK_DB.users.filter(u => u.email !== body.email);
    MOCK_DB.users.push(newUser);
    pushToGlobalCloud();
    return Promise.resolve({ message: `Tạo tài khoản "${newUser.display_name}" thành công!`, data: newUser });
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
      pushToGlobalCloud();
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
    if (user) { user.role_id = body.role_id; pushToGlobalCloud(); }
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
    pushToGlobalCloud();
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
    if (mem) {
      Object.assign(mem, body);
      const userAcc = MOCK_DB.users.find(u => u.email === mem.email || u.id === mem.user_id);
      if (userAcc) {
        if (body.full_name) userAcc.display_name = body.full_name;
        if (body.email) userAcc.email = body.email;
        if (body.password) userAcc.password = body.password;
        if (body.current_position) {
          const roleMap = {
            'Chủ nhiệm': 'role_chu_nhiem',
            'Phó Chủ nhiệm Thường trực': 'role_pcn_thuong_truc',
            'Phó Chủ nhiệm': 'role_pho_chu_nhiem',
            'Ủy viên Ban Chủ nhiệm': 'role_uy_vien_bcn',
            'Thư ký': 'role_thu_ky',
            'Thủ quỹ': 'role_thu_quy',
            'Thành viên': 'role_thanh_vien',
            'Cộng tác viên': 'role_cong_tac_vien'
          };
          const roleId = roleMap[body.current_position] || 'role_thanh_vien';
          const roleObj = MOCK_DB.roles.find(r => r.id === roleId);
          if (roleObj) {
            userAcc.role_id = roleObj.id;
            userAcc.role_name = roleObj.name;
            userAcc.role_level = roleObj.level;
          }
        }
      }
      pushToGlobalCloud();
    }
    return Promise.resolve({ message: 'Cập nhật thông tin thành viên & đồng bộ thành công!', data: mem });
  }
  if (endpoint.match(/\/members\/[^/]+$/) && method === 'DELETE') {
    const memId = endpoint.split('/').pop();
    const mem = MOCK_DB.members.find(m => m.id === memId);
    if (mem) {
      MOCK_DB.users = MOCK_DB.users.filter(u => u.email !== mem.email);
      MOCK_DB.members = MOCK_DB.members.filter(m => m.id !== memId);
      pushToGlobalCloud();
    }
    return Promise.resolve({ message: 'Xóa thành viên thành công!' });
  }
  if (endpoint.match(/\/members\/[^/]+$/) && method === 'GET') {
    const memId = endpoint.split('/').pop();
    const mem = MOCK_DB.members.find(m => m.id === memId) || MOCK_DB.members[0];
    if (!mem) return Promise.resolve({ data: null });
    const ext = mem.external_positions || [{ position: 'Phó Bí thư Chi Đoàn', organization: 'Chi Đoàn Khoa CNTT - ĐH Bách Khoa' }];
    const hist = mem.position_history || [{ role_id: mem.current_position || 'Thành viên', start_date: '2025-01-01', end_date: 'Hiện tại' }];
    return Promise.resolve({ data: { profile: mem, external_positions: ext, position_history: hist } });
  }
  if (endpoint === '/api/members' && method === 'POST') {
    const newMem = { id: 'mem_' + Date.now(), ...body, status: 'active' };
    MOCK_DB.members.push(newMem);
    pushToGlobalCloud();
    return Promise.resolve({ message: 'Tạo thành viên mới thành công!', data: newMem });
  }
  if (endpoint.startsWith('/api/members')) return Promise.resolve({ data: MOCK_DB.members });

  // Leaderboard & Certificates
  if (endpoint.includes('/certificates/leaderboard')) {
    if (!MOCK_DB.years) MOCK_DB.years = ['2026', '2025', '2027'];
    const list = [...(MOCK_DB.members || [])].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
    list.forEach((m, idx) => { m.rank = idx + 1; });
    return Promise.resolve({ data: list, years: MOCK_DB.years });
  }
  if (endpoint === '/api/years' && method === 'POST') {
    const year = (body.year || '').toString().trim();
    if (!year || isNaN(year)) return Promise.reject(new Error('Vui lòng nhập năm hợp lệ! (Ví dụ: 2027)'));
    if (!MOCK_DB.years) MOCK_DB.years = ['2026', '2025', '2027'];
    if (!MOCK_DB.years.includes(year)) {
      MOCK_DB.years.unshift(year);
      MOCK_DB.years.sort((a, b) => b - a);
      pushToGlobalCloud();
    }
    return Promise.resolve({ message: `Đã tạo năm hoạt động ${year} thành công!`, years: MOCK_DB.years });
  }
  if (endpoint === '/api/certificates/points-adjustment' && method === 'POST') {
    const { member_id, type, points, reason } = body;
    const mem = MOCK_DB.members.find(m => m.id === member_id || m.student_id === member_id || m.email === member_id);
    if (!mem) return Promise.reject(new Error('Không tìm thấy thành viên!'));
    
    const pVal = Math.abs(parseFloat(points) || 0);
    const isPenalty = (type === 'penalty' || type === 'subtract');
    const pointDelta = isPenalty ? -pVal : pVal;
    
    mem.total_points = Math.max(0, (mem.total_points || 0) + pointDelta);
    if (isPenalty) {
      mem.penalty_points = (mem.penalty_points || 0) + pVal;
    } else {
      mem.bonus_points = (mem.bonus_points || 0) + pVal;
    }

    if (!mem.points_history) mem.points_history = [];
    mem.points_history.unshift({
      id: 'ph_' + Date.now(),
      title: (isPenalty ? 'Trừ điểm vi phạm' : 'Cộng điểm thưởng') + ': ' + (reason || 'N/A'),
      points: pointDelta,
      type: isPenalty ? 'penalty' : 'bonus',
      date: new Date().toISOString()
    });
    
    const actionLabel = isPenalty ? 'TRỪ ĐIỂM VI PHẠM' : 'CỘNG ĐIỂM THÀNH TÍCH';
    MOCK_DB.logs.unshift({
      timestamp: new Date().toLocaleString('vi-VN'),
      admin: typeof Auth !== 'undefined' ? (Auth.getUser()?.display_name || 'Admin') : 'Admin',
      action: isPenalty ? 'POINTS.PENALTY' : 'POINTS.BONUS',
      module: 'Thành tích',
      detail: `${actionLabel}: ${pointDelta > 0 ? '+' : ''}${pointDelta} ĐTT cho ${mem.full_name} (${reason || 'N/A'})`
    });
    
    MOCK_DB.notifications.unshift({
      id: 'noti_' + Date.now(),
      title: `${actionLabel}: ${pointDelta > 0 ? '+' : ''}${pointDelta} ĐTT`,
      content: `Bạn đã được ${isPenalty ? 'trừ' : 'cộng'} ${pVal} điểm thành tích. Lý do: ${reason || 'N/A'}`,
      type: 'important',
      target: mem.user_id || mem.id || 'all',
      created_at: new Date().toISOString(),
      read_by: []
    });

    pushToGlobalCloud();
    return Promise.resolve({
      message: `Đã ${isPenalty ? 'trừ' : 'cộng'} ${pVal} ĐTT cho ${mem.full_name} thành công!`,
      data: mem
    });
  }
  if (endpoint.includes('/certificates/') && endpoint.includes('/issue')) {
    const memId = endpoint.split('/')[3];
    const mem = MOCK_DB.members.find(m => m.id === memId) || MOCK_DB.members[0];
    return Promise.resolve({ certificate: { certificate_id: 'CERT-STH-2026-' + Math.floor(1000 + Math.random()*9000), title: 'GIẤY CHỨNG NHẬN THÀNH TÍCH XUẤT SẮC', recipient_name: mem.full_name, generation: mem.generation, department: mem.department, reason: 'Ghi nhận thành tích xuất sắc trong hoạt động tình nguyện vì cộng đồng năm 2026.', total_points: mem.total_points||285, issued_date: new Date().toLocaleDateString('vi-VN'), issued_by: 'Ban Chủ nhiệm CLB Sen Trắng' } });
  }
  if (endpoint === '/api/certificates' && method === 'POST') {
    const cert = {
      id: 'cert_' + Date.now(),
      certificate_id: 'CERT-STH-2026-' + Math.floor(1000 + Math.random() * 9000),
      ...body,
      issued_date: body.issued_date || new Date().toLocaleDateString('vi-VN')
    };

    let matchedUser = null;
    if (body.user_id) {
      matchedUser = MOCK_DB.users.find(u => u.id === body.user_id);
    }
    if (!matchedUser && body.recipient_name) {
      matchedUser = MOCK_DB.users.find(u =>
        u.display_name.toLowerCase() === body.recipient_name.toLowerCase() ||
        u.email.toLowerCase() === body.recipient_name.toLowerCase()
      );
    }
    if (!matchedUser && body.member_id) {
      const mem = MOCK_DB.members.find(m => m.id === body.member_id);
      if (mem) {
        matchedUser = MOCK_DB.users.find(u => u.email === mem.email || u.display_name.toLowerCase() === mem.full_name.toLowerCase());
      }
    }
    if (!matchedUser && body.recipient_name) {
      const mem = MOCK_DB.members.find(m => (m.full_name || '').toLowerCase() === body.recipient_name.toLowerCase());
      if (mem) {
        matchedUser = MOCK_DB.users.find(u => u.email === mem.email);
      }
    }

    if (matchedUser) {
      cert.user_id = matchedUser.id;
      cert.user_email = matchedUser.email;
      cert.recipient_name = matchedUser.display_name;
    }

    MOCK_DB.certificates.unshift(cert);

    // Auto-create live targeted notification for recipient user
    MOCK_DB.notifications.unshift({
      id: 'noti_' + Date.now(),
      title: '🎖️ Giấy chứng nhận mới: ' + cert.title,
      content: `Chúc mừng ${cert.recipient_name}! Bạn vừa được ${cert.issued_by || 'Ban Chủ nhiệm'} trao tặng "${cert.title}". Lý do: ${cert.reason}`,
      type: 'important',
      target: matchedUser ? matchedUser.id : (body.user_id || 'all'),
      created_at: new Date().toISOString(),
      read_by: []
    });

    pushToGlobalCloud();
    return Promise.resolve({ message: `Đã cấp chứng nhận thành công cho ${cert.recipient_name}!`, certificate: cert });
  }
  if (endpoint.startsWith('/api/certificates') && method === 'GET') {
    return Promise.resolve({ data: MOCK_DB.certificates || [] });
  }

  // Events
  if (endpoint.includes('/events/') && (endpoint.includes('/attendance') || endpoint.includes('/check-in'))) {
    const eventId = endpoint.split('/')[3];
    const evt = (MOCK_DB.events || []).find(e => e.id === eventId);
    if (evt) {
      evt.current_count = (evt.current_count || 0) + 1;
    }

    const memId = body.member_id;
    let memName = 'Thành viên';
    let mem = null;

    if (memId) {
      mem = (MOCK_DB.members || []).find(m =>
        m.id === memId ||
        m.student_id === memId ||
        m.email === memId ||
        m.user_id === memId ||
        (m.full_name || '').toLowerCase() === (memId || '').toLowerCase()
      );
    }

    const currentUser = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    if (!mem && currentUser) {
      mem = (MOCK_DB.members || []).find(m => m.email === currentUser.email || m.user_id === currentUser.id);
      if (!mem) {
        // Auto-create baseline member record for current logged in user if not present
        mem = {
          id: 'mem_' + Date.now(),
          user_id: currentUser.id,
          full_name: currentUser.display_name || 'Thành viên',
          email: currentUser.email,
          student_id: 'MSTN' + Math.floor(10000 + Math.random() * 90000),
          department: 'Ban Công tác Hoạt động',
          current_position: currentUser.role_name || 'Thành viên',
          status: 'active',
          total_points: 0,
          attendance_points: 0,
          bonus_points: 0,
          penalty_points: 0
        };
        MOCK_DB.members.push(mem);
      }
    }

    if (mem) {
      memName = mem.full_name;
      const reward = evt ? (evt.points_reward || 10) : 10;
      mem.attendance_points = (mem.attendance_points || 0) + reward;
      mem.total_points = (mem.total_points || 0) + reward;

      if (!mem.points_history) mem.points_history = [];
      mem.points_history.unshift({
        id: 'ph_' + Date.now(),
        event_id: evt ? evt.id : null,
        title: 'Điểm danh: ' + (evt ? evt.title : 'Sự kiện CLB'),
        points: reward,
        type: 'attendance',
        date: evt ? (evt.start_date || new Date().toISOString()) : new Date().toISOString()
      });
    }

    pushToGlobalCloud();
    return Promise.resolve({ success: true, message: `Điểm danh thành công cho ${memName}! +10 Điểm thành tích.`, current_count: evt ? evt.current_count : 1 });
  }
  if (endpoint.includes('/events/') && endpoint.includes('/cancel-attendance') && method === 'POST') {
    const eventId = endpoint.split('/')[3];
    const evt = (MOCK_DB.events || []).find(e => e.id === eventId);
    if (evt && evt.current_count > 0) {
      evt.current_count = Math.max(0, evt.current_count - 1);
    }
    const memId = body.member_id;
    const mem = (MOCK_DB.members || []).find(m => m.id === memId || m.student_id === memId || m.email === memId);
    if (mem) {
      const reward = evt ? (evt.points_reward || 10) : 10;
      mem.attendance_points = Math.max(0, (mem.attendance_points || 0) - reward);
      mem.total_points = Math.max(0, (mem.total_points || 0) - reward);
      if (mem.points_history) {
        mem.points_history = mem.points_history.filter(ph => ph.event_id !== eventId && !(ph.title || '').includes(evt ? evt.title : ''));
      }
    }
    pushToGlobalCloud();
    return Promise.resolve({ success: true, message: `Đã hủy điểm danh thành công cho ${mem ? mem.full_name : 'thành viên'}!` });
  }
  if (endpoint === '/api/events' && method === 'POST') {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const newEvt = { id: 'event_' + Date.now(), ...body, current_count: 0, status: 'active', start_date: body.start_date || new Date().toISOString() };
    MOCK_DB.events.push(newEvt);
    
    // Auto broadcast notification for new event
    MOCK_DB.notifications.unshift({
      id: 'noti_' + Date.now(),
      title: `📅 Sự kiện mới: ${newEvt.title}`,
      content: `CLB vừa mở đăng ký tham gia "${newEvt.title}" tại ${newEvt.location || 'CLB'}. Đăng ký ngay để tích lũy điểm thành tích!`,
      type: 'info',
      target: 'all',
      created_at: new Date().toISOString(),
      read_by: []
    });

    MOCK_DB.logs.unshift({
      timestamp: new Date().toLocaleString('vi-VN'),
      admin: currentUser ? currentUser.display_name : 'Ban Hoạt động',
      action: 'EVENT.CREATE',
      module: 'Hoạt động',
      detail: `Tạo sự kiện mới "${newEvt.title}" (Tối đa ${newEvt.max_participants || 50} người)`
    });

    pushToGlobalCloud();
    return Promise.resolve({ message: 'Tạo sự kiện mới thành công!', data: newEvt });
  }
  if (endpoint.startsWith('/api/events')) return Promise.resolve(MOCK_DB.events);

  // Articles
  if (endpoint === '/api/articles' && method === 'POST') {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const newArt = { id: 'article_' + Date.now(), ...body, status: 'published', view_count: 0, author_name: currentUser?.display_name || 'Ban Truyền thông', created_at: new Date().toISOString() };
    MOCK_DB.articles.unshift(newArt);

    // Auto broadcast notification for new article
    MOCK_DB.notifications.unshift({
      id: 'noti_' + Date.now(),
      title: `📰 Bài viết mới: ${newArt.title}`,
      content: `Đã có bài viết mới "${newArt.title}" từ ${newArt.author_name}. Hãy truy cập Cổng truyền thông để đọc bài nhé!`,
      type: 'info',
      target: 'all',
      created_at: new Date().toISOString(),
      read_by: []
    });

    MOCK_DB.logs.unshift({
      timestamp: new Date().toLocaleString('vi-VN'),
      admin: currentUser ? currentUser.display_name : 'Ban Truyền thông',
      action: 'ARTICLE.CREATE',
      module: 'Truyền thông',
      detail: `Đăng bài viết mới "${newArt.title}"`
    });

    pushToGlobalCloud();
    return Promise.resolve({ message: 'Tạo bài viết mới thành công!', data: newArt });
  }
  if (endpoint.startsWith('/api/articles')) return Promise.resolve(MOCK_DB.articles);

  // Quizzes
  if (endpoint.match(/\/quizzes\/[^/]+\/questions/)) {
    const quizId = endpoint.split('/')[3];
    const qz = (MOCK_DB.quizzes || []).find(q => q.id === quizId) || MOCK_DB.quizzes[0];
    return Promise.resolve(qz ? (qz.questions || []) : []);
  }
  if (endpoint.includes('/quizzes/') && endpoint.includes('/submit')) {
    const quizId = endpoint.split('/')[3];
    const qz = (MOCK_DB.quizzes || []).find(q => q.id === quizId) || MOCK_DB.quizzes[0];
    const answers = body.answers || {};
    const questions = qz ? (qz.questions || []) : [];
    
    let correctCount = 0;
    if (questions.length > 0) {
      questions.forEach((q, qi) => {
        const selectedIdx = parseInt(answers[`quiz_q_${qi}`]);
        const correctIdx = (q.options || []).findIndex(o => o.correct === true);
        if (!isNaN(selectedIdx) && (selectedIdx === correctIdx || correctIdx === -1)) {
          correctCount++;
        }
      });
    } else {
      correctCount = 1;
    }

    const totalQuestions = Math.max(1, questions.length);
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const passingScore = qz ? (qz.passing_score || 70) : 70;
    const passed = scorePercent >= passingScore;
    
    const currentUser = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    let earnedPoints = 0;
    let certObj = null;

    if (passed) {
      earnedPoints = Math.round((qz?.points_reward || 20) * (scorePercent / 100)) || 15;
      
      let mem = (MOCK_DB.members || []).find(m => m.user_id === currentUser?.id || m.email === currentUser?.email);
      if (!mem && currentUser) {
        mem = {
          id: 'mem_' + Date.now(),
          user_id: currentUser.id,
          full_name: currentUser.display_name || 'Thành viên',
          email: currentUser.email,
          student_id: 'MSTN' + Math.floor(10000 + Math.random() * 90000),
          department: 'Ban Đào tạo & Kỹ năng',
          current_position: currentUser.role_name || 'Thành viên',
          status: 'active',
          total_points: 0,
          bonus_points: 0,
          attendance_points: 0,
          penalty_points: 0
        };
        MOCK_DB.members.push(mem);
      }

      if (mem) {
        mem.bonus_points = (mem.bonus_points || 0) + earnedPoints;
        mem.total_points = (mem.total_points || 0) + earnedPoints;
        if (!mem.points_history) mem.points_history = [];
        mem.points_history.unshift({
          id: 'ph_' + Date.now(),
          quiz_id: qz ? qz.id : null,
          title: 'Thi trực tuyến: ' + (qz ? qz.title : 'Bài kiểm tra'),
          points: earnedPoints,
          type: 'bonus',
          date: new Date().toISOString()
        });
      }

      // Auto issue certificate if enabled
      if (qz && (qz.issue_certificate || qz.cert_enabled || qz.certificate_content)) {
        certObj = {
          id: 'cert_' + Date.now(),
          certificate_id: 'CERT-STH-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
          title: 'CHỨNG NHẬN HOÀN THÀNH: ' + (qz.title || 'ĐÀO TẠO').toUpperCase(),
          recipient_name: mem ? mem.full_name : (currentUser?.display_name || 'Thành viên'),
          user_id: currentUser?.id,
          user_email: currentUser?.email,
          member_id: mem?.id,
          department: mem?.department || 'Ban Đào tạo',
          reason: qz.certificate_content || `Đã hoàn thành xuất sắc bài thi "${qz.title}" với kết quả ${scorePercent}%`,
          issued_date: new Date().toLocaleDateString('vi-VN'),
          issued_by: 'Hội đồng Thi & Đào tạo CLB Sen Trắng'
        };
        MOCK_DB.certificates.unshift(certObj);
      }

      // Auto create notification
      MOCK_DB.notifications.unshift({
        id: 'noti_' + Date.now(),
        title: `🎉 Kết quả thi "${qz ? qz.title : 'Trắc nghiệm'}": ĐẠT (${scorePercent}%)`,
        content: `Chúc mừng bạn đã hoàn thành bài thi! Kết quả: ${correctCount}/${totalQuestions} câu đúng (${scorePercent}%). Bạn được thưởng +${earnedPoints} Điểm thành tích.${certObj ? ' Giấy chứng nhận điện tử đã được cấp thành công!' : ''}`,
        type: 'info',
        target: currentUser?.id || 'all',
        created_at: new Date().toISOString(),
        read_by: []
      });

      // Audit Log
      MOCK_DB.logs.unshift({
        timestamp: new Date().toLocaleString('vi-VN'),
        admin: currentUser ? currentUser.display_name : 'Thành viên',
        action: 'QUIZ.SUBMIT_PASS',
        module: 'Thi trực tuyến',
        detail: `Hoàn thành xuất sắc bài thi "${qz ? qz.title : 'Đề thi'}" (${scorePercent}%, +${earnedPoints} ĐTT)`
      });
    } else {
      if (currentUser) {
        MOCK_DB.notifications.unshift({
          id: 'noti_' + Date.now(),
          title: `📝 Kết quả bài thi "${qz ? qz.title : 'Trắc nghiệm'}": CHƯA ĐẠT (${scorePercent}%)`,
          content: `Bạn đạt ${scorePercent}% (${correctCount}/${totalQuestions} câu). Cần tối thiểu ${passingScore}% để đạt bài thi. Hãy ôn tập và thử lại nhé!`,
          type: 'warning',
          target: currentUser.id,
          created_at: new Date().toISOString(),
          read_by: []
        });
      }
    }

    pushToGlobalCloud();
    return Promise.resolve({
      total_points: earnedPoints,
      max_points: totalQuestions,
      score_percent: scorePercent,
      correct_count: correctCount,
      total_questions: totalQuestions,
      passed: passed,
      grade: scorePercent >= 90 ? 'Xuất sắc' : (scorePercent >= 80 ? 'Giỏi' : (passed ? 'Đạt' : 'Chưa đạt')),
      earned_points: earnedPoints,
      certificate: certObj
    });
  }
  if (endpoint === '/api/quizzes' && method === 'POST') {
    const currentUser = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const newQz = { id: 'quiz_' + Date.now(), ...body, question_count: (body.questions||[]).length };
    MOCK_DB.quizzes.push(newQz);

    MOCK_DB.notifications.unshift({
      id: 'noti_' + Date.now(),
      title: `📝 Đề thi mới: ${newQz.title}`,
      content: `CLB vừa phát hành đề thi mới "${newQz.title}" (${newQz.question_count} câu, ${Math.round((newQz.duration||1800)/60)} phút). Hãy vào thi ngay!`,
      type: 'info',
      target: 'all',
      created_at: new Date().toISOString(),
      read_by: []
    });

    MOCK_DB.logs.unshift({
      timestamp: new Date().toLocaleString('vi-VN'),
      admin: currentUser ? currentUser.display_name : 'Ban Đào tạo',
      action: 'QUIZ.CREATE',
      module: 'Thi trực tuyến',
      detail: `Phát hành đề thi mới "${newQz.title}" (${newQz.question_count} câu hỏi)`
    });

    pushToGlobalCloud();
    return Promise.resolve({ message: 'Tạo đề thi mới thành công!', data: newQz });
  }
  if (endpoint.startsWith('/api/quizzes')) return Promise.resolve(MOCK_DB.quizzes);

  // Notifications
  if (endpoint.includes('/notifications/read-all') && method === 'PUT') {
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const userId = body.user_id || user?.id;
    if (userId && Array.isArray(MOCK_DB.notifications)) {
      MOCK_DB.notifications.forEach(n => {
        if (!n.read_by) n.read_by = [];
        if (!n.read_by.includes(userId)) n.read_by.push(userId);
      });
      pushToGlobalCloud();
    }
    return Promise.resolve({ message: 'Đã đánh dấu tất cả là đã đọc' });
  }
  if (endpoint.includes('/notifications/') && endpoint.includes('/read')) {
    const notiId = endpoint.split('/')[3];
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const userId = body.user_id || user?.id;
    const noti = (MOCK_DB.notifications || []).find(n => n.id === notiId);
    if (noti && userId) {
      if (!noti.read_by) noti.read_by = [];
      if (!noti.read_by.includes(userId)) {
        noti.read_by.push(userId);
      }
      pushToGlobalCloud();
    }
    return Promise.resolve({ message: 'Đã đánh dấu đã đọc' });
  }
  if (endpoint === '/api/notifications' && method === 'POST') {
    const noti = { id: 'noti_' + Date.now(), ...body, created_at: new Date().toISOString(), read_by: [] };
    MOCK_DB.notifications.unshift(noti);
    pushToGlobalCloud();
    return Promise.resolve({ message: 'Gửi thông báo thành công!', data: noti });
  }
  if (endpoint.startsWith('/api/notifications') && method === 'GET') {
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const allNotis = MOCK_DB.notifications || [];
    
    const userNotis = allNotis.filter(n => {
      if (!user) return false;
      if (!n.target || n.target === 'all') return true;
      if (n.target === user.id || n.target === user.email || n.target === user.role_id) return true;
      if (n.user_id && n.user_id === user.id) return true;
      if (n.target && (n.target.toLowerCase() === (user.display_name || '').toLowerCase() || n.target.toLowerCase() === (user.email || '').toLowerCase())) return true;
      
      const userMem = (MOCK_DB.members || []).find(m => m.email === user.email || m.user_id === user.id);
      if (userMem) {
        if (n.target === userMem.id || n.target === userMem.email) return true;
        if (n.target && n.target.toLowerCase() === (userMem.full_name || '').toLowerCase()) return true;
      }
      return false;
    });
    return Promise.resolve({ data: userNotis });
  }

  // System Module Data Reset (Admin Permission Required)
  if (endpoint.includes('/system/reset-module') && method === 'POST') {
    const moduleKey = body.module;
    let label = 'Phân hệ';

    switch (moduleKey) {
      case 'members':
      case 'users':
        MOCK_DB.members = [];
        label = 'Hồ sơ Nhân sự & Thành viên';
        break;
      case 'events':
        MOCK_DB.events = [];
        label = 'Sự kiện & Lịch sử Điểm danh';
        break;
      case 'leaderboard':
        (MOCK_DB.members || []).forEach(m => {
          m.bonus_points = 0;
          m.penalty_points = 0;
          m.attendance_points = 0;
          m.total_points = 0;
        });
        label = 'Bảng xếp hạng Điểm thành tích';
        break;
      case 'certificates':
        MOCK_DB.certificates = [];
        label = 'Danh sách Giấy chứng nhận';
        break;
      case 'articles':
        MOCK_DB.articles = [];
        label = 'Bài viết Truyền thông CMS';
        break;
      case 'quizzes':
        MOCK_DB.quizzes = [];
        label = 'Thi trực tuyến';
        break;
      case 'notifications':
        MOCK_DB.notifications = [];
        label = 'Thông báo Hệ thống';
        break;
      default:
        label = moduleKey;
    }

    MOCK_DB.logs.unshift({
      timestamp: new Date().toLocaleString('vi-VN'),
      admin: typeof Auth !== 'undefined' ? (Auth.getUser()?.display_name || 'Admin') : 'Admin',
      action: 'SYSTEM.RESET',
      module: label,
      detail: `Đã Xóa sạch (Reset) toàn bộ dữ liệu phân hệ ${label} về trạng thái trống (Empty)`
    });

    saveMockDbToStorage();
    pushToGlobalCloud();
    return Promise.resolve({ message: `Đã Xóa sạch (Reset) toàn bộ dữ liệu phân hệ "${label}" về trạng thái trống (0 dữ liệu)!`, module: moduleKey });
  }

  return Promise.resolve({ status: 'ok' });
}

// Fetch API Wrapper
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  const resolved = resolveEndpoint(endpoint);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    const text = await response.text();

    if (!response.ok || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      return getMockApiResponse(resolved, options);
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed && (parsed.detail || parsed.error || parsed.message)) {
        return getMockApiResponse(resolved, options);
      }
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) return parsed;
      
      const mockResult = await getMockApiResponse(resolved, options);
      if (Array.isArray(mockResult) && mockResult.length > 0) return mockResult;
      return parsed;
    } catch {
      return getMockApiResponse(resolved, options);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[API Fallback] ${endpoint} timed out or failed, switching to client mock data:`, error.message);
    return getMockApiResponse(resolved, options);
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
    if (!user) return false;
    return (
      user.role_id === 'role_super_admin' ||
      user.role_name === 'Super Admin' ||
      user.role_level === 0 ||
      user.role_level === '0' ||
      user.email === 'admin@sentranghub.vn' ||
      (Array.isArray(user.permissions) && user.permissions.includes('*'))
    );
  } catch { return false; }
}

// Expose globals
window.escapeHTML = escapeHTML;
window.showToast = showToast;
window.apiFetch = apiFetch;
window.API = API;
window.hasPermission = hasPermission;
window.isSuperAdmin = isSuperAdmin;
window.getCurrentUserPermissions = getCurrentUserPermissions;
window.MOCK_DB = MOCK_DB;
window.ensureSeedData = ensureSeedData;

