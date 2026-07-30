/**
 * Sen Trắng Hub v2 — Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  const currentUser = Auth.getUser();
  initUserInfo(currentUser);
  initNavigation();
  initMobileMenu();
  loadOverviewStats();
  loadRolesGrid();
  loadLatestNews();
  updateNotiBadge();
  startRealTimeSyncManager();

  document.getElementById('btn-logout')?.addEventListener('click', () => Auth.logout());
  updateClock();
  setInterval(updateClock, 1000);
});

// ========================================
// User Info
// ========================================
function initUserInfo(user) {
  if (!user) return;
  const el = (id) => document.getElementById(id);
  if (el('user-display-name')) el('user-display-name').textContent = user.display_name || 'Người dùng';
  if (el('user-role-badge')) el('user-role-badge').textContent = user.role_name || 'Thành viên';
  if (el('user-avatar')) el('user-avatar').textContent = (user.display_name || 'U').charAt(0).toUpperCase();

  // Welcome banner personalization
  if (el('welcome-title')) el('welcome-title').textContent = `Xin chào, ${user.display_name}!`;
  if (el('welcome-desc')) {
    el('welcome-desc').textContent = `Bạn đang đăng nhập với quyền ${user.role_name}. ${isSuperAdmin() ? 'Toàn quyền quản lý hệ thống.' : 'Một số chức năng có thể bị giới hạn theo vai trò của bạn.'}`;
  }
}

// ========================================
// Live Clock
// ========================================
function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById('clock-text');
  if (clockEl) clockEl.textContent = now.toLocaleDateString('vi-VN', { weekday:'long', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

// ========================================
// Mobile Menu
// ========================================
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('active');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

function closeMobileMenu() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');
}

// ========================================
// Navigation
// ========================================
let currentView = 'overview';

function initNavigation() {
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      showView(item.getAttribute('data-view'));
      closeMobileMenu();
    });
  });
}

function showView(viewId) {
  currentView = viewId;
  document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const target = document.getElementById(`view-${viewId}`);
  if (target) target.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (nav) nav.classList.add('active');

  const titleMap = {
    'overview':'Tổng quan hệ thống', 'users':'Hồ sơ Nhân sự', 'roles':'Phân quyền & System Log',
    'events':'Sự kiện & Điểm danh QR', 'leaderboard':'Thống kê Thành tích & Điểm số', 'certificates':'Giấy chứng nhận & Vinh danh',
    'articles':'Truyền thông CMS', 'quizzes':'Thi trực tuyến', 'notifications':'Thông báo hệ thống'
  };
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = titleMap[viewId] || 'Dashboard';

  switch (viewId) {
    case 'overview': loadOverviewStats(); loadLatestNews(); loadOverviewCertificates(); break;
    case 'users': if (typeof loadMembersList === 'function') loadMembersList(); break;
    case 'events': if (typeof loadEventsList === 'function') loadEventsList(); break;
    case 'leaderboard': if (typeof loadLeaderboard === 'function') loadLeaderboard(); break;
    case 'certificates': if (typeof loadCertificatesList === 'function') loadCertificatesList(); break;
    case 'articles': if (typeof loadArticlesList === 'function') loadArticlesList(); break;
    case 'quizzes': if (typeof loadQuizzesList === 'function') loadQuizzesList(); break;
    case 'notifications': if (typeof loadNotificationsList === 'function') loadNotificationsList(); break;
    case 'roles': loadRolesGrid(); loadUserPermissionsTable(); loadSystemLogs(); break;
  }
}

function refreshCurrentView() {
  showView(currentView);
  showToast('Đã làm mới dữ liệu!', 'success');
}

// ========================================
// Overview Stats & Certificates
// ========================================
async function loadOverviewStats() {
  try {
    const users = await apiFetch('/api/users');
    const roles = await apiFetch('/api/roles');
    const events = await apiFetch('/api/events');

    const userList = Array.isArray(users) ? users : [];
    const el = (id) => document.getElementById(id);
    if (el('stat-total-users')) el('stat-total-users').textContent = userList.length;
    if (el('stat-total-roles')) el('stat-total-roles').textContent = Array.isArray(roles) ? roles.length : 0;
    if (el('stat-active-users')) el('stat-active-users').textContent = userList.filter(u => u.is_active).length;
    if (el('stat-active-events')) el('stat-active-events').textContent = Array.isArray(events) ? events.length : 0;
  } catch (err) { console.warn('Stats error:', err); }
}

async function loadOverviewCertificates() {
  const container = document.getElementById('user-my-certificates-container');
  if (!container) return;
  const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
  
  try {
    const certsRes = await apiFetch('/api/certificates');
    const allCerts = Array.isArray(certsRes) ? certsRes : (certsRes.data || []);
    
    let myCerts = [];
    if (user) {
      myCerts = allCerts.filter(c => c.user_id === user.id || c.recipient_name === user.display_name);
    }
    if (myCerts.length === 0) myCerts = allCerts.slice(0, 3); // Fallback to show recent certificates

    if (myCerts.length === 0) {
      container.innerHTML = `
        <div class="card-panel">
          <div class="panel-header">
            <h3 class="panel-title">🎖️ Giấy chứng nhận & Vinh danh</h3>
          </div>
          <div style="font-size:0.85rem;color:var(--text-muted);padding:1rem;text-align:center;">
            Bạn chưa nhận được giấy chứng nhận nào. Hãy tích cực tham gia các hoạt động để nhận vinh danh nhé!
          </div>
        </div>
      `;
      return;
    }

    const certCardsHTML = myCerts.map(cert => `
      <div style="background:linear-gradient(135deg,#FFF8E1,#FFF3E0);border:1px solid #FFB74D;border-radius:var(--radius-lg);padding:1rem;box-shadow:var(--shadow-sm);display:flex;align-items:center;justify-content:space-between;gap:1rem;">
        <div style="display:flex;align-items:center;gap:0.85rem;">
          <div style="width:42px;height:42px;border-radius:50%;background:#FF9800;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0;">🎖️</div>
          <div>
            <div style="font-weight:700;font-size:0.925rem;color:#BF360C;">${escapeHTML(cert.title)}</div>
            <div style="font-size:0.775rem;color:var(--text-muted);">${escapeHTML(cert.recipient_name)} • ${escapeHTML(cert.department || 'Ban Hoạt động')}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.25rem;">"${escapeHTML(cert.reason)}"</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick='displayCertificateModal(${JSON.stringify(cert)})' style="flex-shrink:0;">📜 Xem Giấy</button>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="card-panel">
        <div class="panel-header">
          <h3 class="panel-title">🎖️ Giấy chứng nhận & Vinh danh</h3>
          <button class="btn btn-secondary btn-sm" onclick="showView('leaderboard')">Xem tất cả chứng nhận →</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:1rem;">
          ${certCardsHTML}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '';
  }
}

async function openUserProfileModal() {
  const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
  if (!user) { showToast('Vui lòng đăng nhập lại!', 'error'); return; }

  let memberInfo = null;
  let userCerts = [];
  try {
    const memRes = await apiFetch('/api/members');
    const members = Array.isArray(memRes) ? memRes : (memRes.data || []);
    memberInfo = members.find(m => m.user_id === user.id || m.email === user.email);

    const certRes = await apiFetch('/api/certificates');
    const certs = Array.isArray(certRes) ? certRes : (certRes.data || []);
    userCerts = certs.filter(c => c.user_id === user.id || c.recipient_name === user.display_name);
  } catch {}

  const initial = (user.display_name || 'U').charAt(0).toUpperCase();
  const studentId = memberInfo?.student_id || 'Chưa cập nhật';
  const dept = memberInfo?.department || 'Ban Chủ nhiệm';
  const position = memberInfo?.current_position || user.role_name || 'Thành viên';
  const points = memberInfo?.total_points || 0;

  const extList = memberInfo?.external_positions || [
    { position: 'Phó Bí thư Chi Đoàn', organization: 'Chi Đoàn Khoa CNTT - ĐH Bách Khoa' }
  ];
  const histList = memberInfo?.position_history || [
    { role_id: position, start_date: '2025-01-01', end_date: 'Hiện tại' }
  ];

  const certsHTML = userCerts.length > 0
    ? userCerts.map(c => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0.85rem;background:var(--bg-main);border:1px solid var(--border-light);border-radius:var(--radius-md);margin-bottom:0.5rem;">
          <div>
            <div style="font-weight:700;font-size:0.85rem;color:var(--primary-700);">📜 ${escapeHTML(c.title)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHTML(c.issued_date || '2026')} • ${escapeHTML(c.issued_by || 'Ban Chủ nhiệm')}</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick='displayCertificateModal(${JSON.stringify(c)})'>Xem</button>
        </div>
      `).join('')
    : '<div style="font-size:0.825rem;color:var(--text-muted);">Chưa có giấy chứng nhận nào được ghi nhận.</div>';

  showModal('👤 Hồ Sơ Thông Tin Cá Nhân', `
    <div style="display:flex;align-items:center;gap:1.25rem;margin-bottom:1.25rem;background:var(--bg-main);padding:1.25rem;border-radius:var(--radius-lg);border:1px solid var(--border-light);">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--primary-gradient);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.6rem;flex-shrink:0;">${initial}</div>
      <div style="flex:1;">
        <h3 style="font-size:1.2rem;font-weight:800;margin:0 0 0.2rem 0;color:var(--text-primary);">${escapeHTML(user.display_name)}</h3>
        <div style="font-size:0.825rem;color:var(--text-muted);margin-bottom:0.4rem;">${escapeHTML(user.email)}</div>
        <span class="badge-role" style="font-size:0.75rem;font-weight:700;">${escapeHTML(user.role_name || 'Thành viên')}</span>
      </div>
      ${memberInfo ? `<button class="btn btn-secondary btn-sm" onclick="closeModal(); viewMemberDetail('${memberInfo.id}')">✏️ Sửa Hồ Sơ Chi Tiết</button>` : ''}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:1rem;">
      <div style="background:var(--bg-card);padding:0.85rem;border-radius:var(--radius-md);border:1px solid var(--border-light);">
        <div style="font-size:0.75rem;color:var(--text-muted);">🆔 MSTN - MÃ SỐ THANH NIÊN</div>
        <div style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-top:0.25rem;">${escapeHTML(studentId)}</div>
      </div>
      <div style="background:var(--bg-card);padding:0.85rem;border-radius:var(--radius-md);border:1px solid var(--border-light);">
        <div style="font-size:0.75rem;color:var(--text-muted);">🏆 Điểm thành tích (+ĐTT)</div>
        <div style="font-size:1.1rem;font-weight:800;color:var(--primary-600);margin-top:0.25rem;">${points} ĐTT</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:1rem;">
      <div style="background:var(--bg-card);padding:0.85rem;border-radius:var(--radius-md);border:1px solid var(--border-light);">
        <div style="font-size:0.75rem;color:var(--text-muted);">🏛️ Ban hoạt động</div>
        <div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-top:0.25rem;">${escapeHTML(dept)}</div>
      </div>
      <div style="background:var(--bg-card);padding:0.85rem;border-radius:var(--radius-md);border:1px solid var(--border-light);">
        <div style="font-size:0.75rem;color:var(--text-muted);">💼 Chức danh nhiệm kỳ</div>
        <div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-top:0.25rem;">${escapeHTML(position)}</div>
      </div>
    </div>

    <!-- Chức vụ kiêm nhiệm bên ngoài -->
    <div style="background:var(--bg-main);padding:0.85rem 1rem;border-radius:var(--radius-md);margin-bottom:1rem;border:1px solid var(--border-light);">
      <div style="font-size:0.75rem;font-weight:700;color:var(--primary-700);margin-bottom:0.3rem;">🏢 Chức vụ kiêm nhiệm bên ngoài</div>
      <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">
        • <strong>${escapeHTML(extList[0]?.position || 'Chưa ghi nhận')}</strong> ${extList[0]?.organization ? `tại <em>${escapeHTML(extList[0].organization)}</em>` : ''}
      </div>
    </div>

    <!-- Lịch sử thăng tiến -->
    <div style="background:var(--success-bg);padding:0.85rem 1rem;border-radius:var(--radius-md);margin-bottom:1rem;border:1px solid rgba(0,200,83,0.2);">
      <div style="font-size:0.75rem;font-weight:700;color:#1B5E20;margin-bottom:0.3rem;">⏳ Lịch sử thăng tiến quá trình</div>
      <div style="font-size:0.85rem;font-weight:600;color:#1B5E20;">
        • <strong>${escapeHTML(histList[0]?.role_id || position)}</strong> (${escapeHTML(histList[0]?.start_date || '2025-01-01')} → ${escapeHTML(histList[0]?.end_date || 'Hiện tại')})
      </div>
    </div>

    <div style="margin-bottom:1.25rem;">
      <h4 style="font-size:0.875rem;font-weight:700;color:var(--primary-700);margin-bottom:0.6rem;">🎖️ Giấy chứng nhận đã nhận (${userCerts.length})</h4>
      <div style="max-height:160px;overflow-y:auto;">
        ${certsHTML}
      </div>
    </div>

    <div style="display:flex;gap:0.75rem;margin-top:1.25rem;">
      <button class="btn btn-secondary btn-block" onclick="closeModal(); openChangePasswordModal();">🔑 Đổi Mật Khẩu</button>
      <button class="btn btn-primary btn-block" onclick="closeModal();">Đóng</button>
    </div>
  `);
}

// ========================================
// Latest News (Overview)
// ========================================
async function loadLatestNews() {
  const container = document.getElementById('latest-news-container');
  if (!container) return;
  try {
    const articles = await apiFetch('/api/articles');
    const list = Array.isArray(articles) ? articles : [];
    if (list.length === 0) { container.innerHTML = '<div class="text-center" style="padding:1rem;color:var(--text-muted);">Chưa có bản tin nào.</div>'; return; }

    container.innerHTML = list.slice(0, 4).map(a => `
      <div style="display:flex;align-items:flex-start;gap:0.85rem;padding:0.85rem 0;border-bottom:1px solid var(--border-light);">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--primary-500);margin-top:6px;flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin:0 0 0.2rem;">${escapeHTML(a.title)}</h4>
          <p style="font-size:0.8rem;color:var(--text-muted);margin:0;">${escapeHTML(a.excerpt || '')}</p>
          <span style="font-size:0.7rem;color:var(--text-muted);margin-top:0.3rem;display:block;">✍️ ${escapeHTML(a.author_name || 'Ban Truyền thông')} • ${new Date(a.created_at || Date.now()).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
    `).join('');
  } catch (err) { container.innerHTML = '<div class="text-center" style="padding:1rem;color:var(--text-muted);">Không thể tải bản tin.</div>'; }
}

// ========================================
// Notification Badge & Real-Time Sync Manager
// ========================================
async function updateNotiBadge() {
  try {
    const res = await apiFetch('/api/notifications');
    const list = res.data || [];
    const user = Auth.getUser();
    const unread = list.filter(n => !n.read_by.includes(user?.id)).length;
    const badge = document.getElementById('noti-badge');
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }
  } catch (err) { /* silent */ }
}

let lastKnownNotiId = null;
let lastKnownUserPermsJson = '';

function startRealTimeSyncManager() {
  performSyncCheck();
  setInterval(performSyncCheck, 4000); // Check for real-time updates every 4 seconds

  // Listen for cross-tab storage changes on the same device
  window.addEventListener('storage', (e) => {
    if (e.key === CONFIG.STORAGE_KEYS.USER_DATA || e.key === 'sentrang_sync_trigger') {
      console.log('[Real-Time Sync] Cross-tab event detected, updating active session...');
      const updatedUser = Auth.getUser();
      if (updatedUser) initUserInfo(updatedUser);
      updateNotiBadge();
    }
  });

  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel('sentrang_hub_realtime');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'STATE_CHANGED') {
          performSyncCheck();
        }
      };
    } catch {}
  }
}

let lastSyncTimestamp = 0;

async function performSyncCheck() {
  try {
    const syncData = await apiFetch('/api/sync');
    if (!syncData) return;

    // 0. Auto Refresh Active View when Global Cloud DB Version Updates
    const hasDataChanged = (syncData.timestamp && syncData.timestamp !== lastSyncTimestamp);
    if (hasDataChanged && lastSyncTimestamp !== 0) {
      console.log('[Real-Time Sync] Database version updated, refreshing active view silently...');
      refreshActiveViewSilently();
    }
    if (syncData.timestamp) lastSyncTimestamp = syncData.timestamp;

    // 1. Live Notification Alert & Badge Pulse
    if (syncData.latest_notification) {
      const notiId = syncData.latest_notification.id || syncData.latest_notification.title;
      if (lastKnownNotiId !== null && lastKnownNotiId !== notiId) {
        showToast(`🔔 Thông báo mới: ${syncData.latest_notification.title}`, 'info');
        const badge = document.getElementById('noti-badge');
        if (badge) {
          badge.classList.add('badge-bounce');
          setTimeout(() => badge.classList.remove('badge-bounce'), 800);
        }
      }
      lastKnownNotiId = notiId;
    }

    const badge = document.getElementById('noti-badge');
    if (badge) {
      const count = syncData.unread_notifications || 0;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }

    // 2. Cross-Device Account & Permission Sync
    const currentLocalUser = Auth.getUser();
    if (currentLocalUser && currentLocalUser.role_id !== 'role_super_admin') {
      if (!syncData.user_profile || syncData.user_profile.id !== currentLocalUser.id) {
        console.warn('[Real-Time Sync] User session no longer exists in system database. Auto logging out...');
        Auth.logout();
        return;
      }
    }

    if (syncData.user_profile) {
      const newPermsJson = JSON.stringify(syncData.user_profile.permissions || []);
      
      if (currentLocalUser && (currentLocalUser.role_id !== syncData.user_profile.role_id || (lastKnownUserPermsJson && lastKnownUserPermsJson !== newPermsJson))) {
        showToast('🛡️ Phân quyền tài khoản của bạn đã được quản trị viên cập nhật đồng bộ!', 'success');
        currentLocalUser.role_id = syncData.user_profile.role_id;
        currentLocalUser.role_name = syncData.user_profile.role_name;
        currentLocalUser.permissions = syncData.user_profile.permissions;
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(currentLocalUser));
        initUserInfo(currentLocalUser);
      }
      lastKnownUserPermsJson = newPermsJson;
    }
  } catch (err) {
    /* Silent catch for network sync issues */
  }
}

function refreshActiveViewSilently() {
  switch (currentView) {
    case 'overview':
      if (typeof loadOverviewStats === 'function') loadOverviewStats();
      if (typeof loadLatestNews === 'function') loadLatestNews();
      if (typeof loadOverviewCertificates === 'function') loadOverviewCertificates();
      break;
    case 'users':
      if (typeof loadMembersList === 'function') loadMembersList();
      break;
    case 'events':
      if (typeof loadEventsList === 'function') loadEventsList();
      break;
    case 'leaderboard':
      if (typeof loadLeaderboard === 'function') loadLeaderboard();
      break;
    case 'certificates':
      if (typeof loadCertificatesList === 'function') loadCertificatesList();
      break;
    case 'articles':
      if (typeof loadArticlesList === 'function') loadArticlesList();
      break;
    case 'quizzes':
      if (typeof loadQuizzesList === 'function') loadQuizzesList();
      break;
    case 'notifications':
      if (typeof loadNotificationsList === 'function') loadNotificationsList();
      break;
  }
}

// ========================================
// Granular Permissions Configuration
// ========================================
const PERMISSION_MODULES = [
  {
    title: '👥 Quản trị Nhân sự',
    items: [
      { key: 'users.read', label: 'Xem danh sách & hồ sơ thành viên' },
      { key: 'users.create', label: 'Thêm mới thành viên & cấp tài khoản' },
      { key: 'users.update', label: 'Chỉnh sửa thông tin thành viên' },
      { key: 'users.delete', label: 'Xóa thành viên khỏi hệ thống' }
    ]
  },
  {
    title: '🛡️ Phân quyền & Hệ thống',
    items: [
      { key: 'roles.manage', label: 'Quản lý vai trò & phân quyền trực tiếp' },
      { key: 'logs.view', label: 'Xem nhật ký hoạt động hệ thống' }
    ]
  },
  {
    title: '📅 Sự kiện & QR Check-in',
    items: [
      { key: 'events.read', label: 'Xem danh sách sự kiện' },
      { key: 'events.create', label: 'Tạo mới & quản lý sự kiện' },
      { key: 'attendance.manage', label: 'Thực hiện điểm danh QR Code' }
    ]
  },
  {
    title: '📰 Truyền thông CMS',
    items: [
      { key: 'articles.read', label: 'Xem tin bài truyền thông' },
      { key: 'articles.create', label: 'Soạn thảo bài viết mới' },
      { key: 'articles.publish', label: 'Duyệt & xuất bản bài viết' }
    ]
  },
  {
    title: '📝 Thi trực tuyến',
    items: [
      { key: 'quizzes.take', label: 'Tham gia thi trắc nghiệm' },
      { key: 'quizzes.create', label: 'Tạo mới & quản lý đề thi' }
    ]
  },
  {
    title: '🏆 Vinh danh & Chứng nhận',
    items: [
      { key: 'certificates.view', label: 'Xem bảng xếp hạng & chứng nhận' },
      { key: 'certificates.issue', label: 'Cấp & Cấp lại Giấy chứng nhận' }
    ]
  },
  {
    title: '📢 Thông báo',
    items: [
      { key: 'notifications.create', label: 'Tạo & gửi thông báo hệ thống' }
    ]
  }
];

let cachedUsers = [];
let cachedRoles = [];

function canManagePermissions() {
  return (typeof isSuperAdmin === 'function' && isSuperAdmin()) || (typeof hasPermission === 'function' && hasPermission('roles.manage'));
}

const PERMISSION_LABEL_MAP = {
  '*': 'Toàn quyền hệ thống (*)',
  'users.read': 'Xem danh sách & hồ sơ thành viên',
  'users.create': 'Thêm mới thành viên & cấp tài khoản',
  'users.update': 'Chỉnh sửa thông tin thành viên',
  'users.delete': 'Xóa thành viên khỏi hệ thống',
  'roles.manage': 'Quản lý vai trò & phân quyền trực tiếp',
  'logs.view': 'Xem nhật ký hoạt động hệ thống',
  'events.read': 'Xem danh sách sự kiện',
  'events.create': 'Tạo mới & quản lý sự kiện',
  'attendance.manage': 'Thực hiện điểm danh QR Code',
  'articles.read': 'Xem tin bài truyền thông',
  'articles.create': 'Soạn thảo bài viết mới',
  'articles.publish': 'Duyệt & xuất bản bài viết',
  'quizzes.take': 'Tham gia thi trắc nghiệm',
  'quizzes.create': 'Tạo mới & quản lý đề thi',
  'certificates.view': 'Xem bảng xếp hạng & chứng nhận',
  'certificates.issue': 'Cấp & cấp lại giấy chứng nhận',
  'notifications.create': 'Tạo & gửi thông báo hệ thống'
};

// 1. Roles Grid
async function loadRolesGrid() {
  const container = document.getElementById('roles-cards-container');
  if (!container) return;
  try {
    const roles = await apiFetch('/api/roles');
    cachedRoles = Array.isArray(roles) ? roles : [];
    if (cachedRoles.length === 0) { container.innerHTML = '<div class="text-center">Chưa có vai trò nào.</div>'; return; }

    const canEdit = canManagePermissions();
    const levelColors = { 0:{bg:'#FFEBEE',border:'#EF5350',text:'#C62828'}, 1:{bg:'#FFF3E0',border:'#FF9800',text:'#E65100'}, 2:{bg:'#E3F2FD',border:'#42A5F5',text:'#0D47A1'}, 3:{bg:'#F3E5F5',border:'#AB47BC',text:'#6A1B9A'}, 10:{bg:'#E8F5E9',border:'#66BB6A',text:'#1B5E20'} };
    container.innerHTML = cachedRoles.map(r => {
      const c = levelColors[r.level] || levelColors[10];
      
      let permListHTML = '';
      if (r.permissions.includes('*')) {
        permListHTML = `<span style="color:#C62828;font-weight:700;">🔑 Toàn quyền hệ thống (*)</span>`;
      } else {
        const labels = r.permissions.map(p => PERMISSION_LABEL_MAP[p] || p);
        permListHTML = labels.map(l => `<div style="font-size:0.775rem;color:var(--text-secondary);margin-top:0.2rem;">• ${escapeHTML(l)}</div>`).join('');
      }

      const actionButton = canEdit
        ? `<button class="btn btn-secondary btn-sm" style="margin-top:0.75rem;align-self:flex-start;" onclick="openEditRolePermissionsModal('${r.id}')">✏️ Cấu hình quyền vai trò</button>`
        : `<span style="font-size:0.75rem;color:var(--text-muted);margin-top:0.75rem;display:inline-block;">🔒 Chỉ Admin mới được chỉnh sửa</span>`;

      return `<div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:1.25rem;box-shadow:var(--shadow-sm);border-left:4px solid ${c.border};display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
            <span style="font-size:0.8rem;padding:0.2rem 0.65rem;background:${c.bg};color:${c.text};font-weight:700;border-radius:var(--radius-full);">${escapeHTML(r.name)}</span>
            <span style="font-size:0.7rem;color:var(--text-muted);font-weight:600;">Level ${r.level}</span>
          </div>
          <p style="font-size:0.825rem;color:var(--text-secondary);margin-bottom:0.75rem;">${escapeHTML(r.description)}</p>
          <div style="font-size:0.8rem;font-weight:700;color:var(--primary-700);margin-bottom:0.35rem;">📋 Danh sách chức năng được phép:</div>
          <div style="background:var(--bg-main);padding:0.6rem;border-radius:var(--radius-md);border:1px solid var(--border-light);max-height:140px;overflow-y:auto;">
            ${permListHTML}
          </div>
        </div>
        ${actionButton}
      </div>`;
    }).join('');
  } catch (err) { container.innerHTML = `<div class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</div>`; }
}

function openEditRolePermissionsModal(roleId) {
  if (!canManagePermissions()) {
    showToast('🔒 Chỉ Admin / Super Admin mới có quyền chỉnh sửa phân quyền!', 'warning');
    return;
  }
  const r = cachedRoles.find(x => x.id === roleId);
  if (!r) return;

  const currentPerms = r.permissions || [];
  const isSuper = currentPerms.includes('*');

  let groupsHTML = PERMISSION_MODULES.map(group => {
    let itemsHTML = group.items.map(item => {
      const checked = isSuper || currentPerms.includes(item.key) ? 'checked' : '';
      return `
        <label style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.6rem;background:var(--bg-main);border:1px solid var(--border-light);border-radius:var(--radius-md);cursor:pointer;font-size:0.825rem;">
          <input type="checkbox" class="role-perm-checkbox" value="${item.key}" ${checked}>
          <div>
            <div style="font-weight:600;color:var(--text-primary);">${escapeHTML(item.label)}</div>
            <code style="font-size:0.7rem;color:var(--primary-600);">${escapeHTML(item.key)}</code>
          </div>
        </label>
      `;
    }).join('');

    return `
      <div style="margin-bottom:1rem;background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:0.85rem;">
        <h4 style="font-size:0.875rem;font-weight:700;color:var(--primary-700);margin-bottom:0.6rem;">${group.title}</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:0.5rem;">
          ${itemsHTML}
        </div>
      </div>
    `;
  }).join('');

  showModal(`✏️ Cấu Hình Quyền Vai Trò: ${escapeHTML(r.name)}`, `
    <form onsubmit="handleSaveRolePermissions(event, '${r.id}')">
      <div style="background:var(--info-bg);border:1px solid rgba(33,150,243,0.2);border-radius:var(--radius-md);padding:0.75rem;margin-bottom:1rem;font-size:0.825rem;color:var(--primary-700);">
        🛡️ Bạn đang thiết lập danh sách quyền mặc định cho vai trò <strong>${escapeHTML(r.name)}</strong>.
      </div>
      <div style="max-height:420px;overflow-y:auto;padding-right:0.35rem;">
        ${groupsHTML}
      </div>
      <div style="margin-top:1rem;">
        <button type="submit" class="btn btn-primary btn-block">💾 Lưu Cấu Hình Vai Trò</button>
      </div>
    </form>
  `);
}

async function handleSaveRolePermissions(e, roleId) {
  e.preventDefault();
  if (!canManagePermissions()) {
    showToast('🔒 Chỉ Admin / Super Admin mới có quyền chỉnh sửa phân quyền!', 'error');
    return;
  }
  const checkboxes = document.querySelectorAll('.role-perm-checkbox:checked');
  const selectedPerms = Array.from(checkboxes).map(cb => cb.value);

  try {
    const res = await apiFetch(`/api/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify({
        permissions: roleId === 'role_super_admin' ? ['*'] : selectedPerms
      })
    });

    showToast(res.message || 'Cập nhật quyền vai trò thành công!', 'success');
    closeModal();
    loadRolesGrid();
    loadSystemLogs();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

// 2. User Direct Permissions Management
async function loadUserPermissionsTable() {
  const container = document.getElementById('user-permissions-table-body');
  if (!container) return;
  container.innerHTML = `<tr><td colspan="4" class="text-center">Đang tải danh sách tài khoản...</td></tr>`;
  try {
    const users = await apiFetch('/api/users');
    cachedUsers = Array.isArray(users) ? users : [];
    if (cachedUsers.length === 0) {
      container.innerHTML = `<tr><td colspan="4" class="text-center">Chưa có tài khoản nào.</td></tr>`;
      return;
    }

    const canEdit = canManagePermissions();
    const colors = ['#1E88E5','#00C853','#FF6D00','#7C4DFF','#FF1744','#00BCD4'];
    container.innerHTML = cachedUsers.map((u, i) => {
      const color = colors[i % colors.length];
      const initial = (u.display_name || 'U').charAt(0).toUpperCase();
      const perms = u.permissions || [];
      
      let permsBadge = '';
      if (perms.includes('*')) {
        permsBadge = `<span class="badge-role" style="background:#FFEBEE;color:#C62828;font-weight:700;">🔑 TOÀN QUYỀN HỆ THỐNG (*)</span>`;
      } else if (perms.length === 0) {
        permsBadge = `<span style="font-size:0.8rem;color:var(--text-muted);">Chưa được gán quyền riêng</span>`;
      } else {
        permsBadge = perms.map(p => `<span class="badge-role" style="margin-right:0.25rem;margin-bottom:0.25rem;display:inline-block;font-size:0.725rem;">${escapeHTML(p)}</span>`).join('');
      }

      const actionBtn = canEdit
        ? `<button class="btn btn-primary btn-sm" onclick="openUserPermissionsModal('${u.id}')">⚙️ Phân quyền trực tiếp</button>`
        : `<span style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">🔒 Chỉ Admin</span>`;

      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.65rem;">
            <div style="width:36px;height:36px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;">${initial}</div>
            <div>
              <div style="font-weight:700;font-size:0.9rem;">${escapeHTML(u.display_name)}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHTML(u.email)}</div>
            </div>
          </div>
        </td>
        <td><span class="badge-role" style="font-weight:700;">${escapeHTML(u.role_name || 'Thành viên')}</span></td>
        <td style="max-width:320px;">${permsBadge}</td>
        <td>${actionBtn}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</td></tr>`;
  }
}

function openUserPermissionsModal(userId) {
  if (!canManagePermissions()) {
    showToast('🔒 Chỉ Super Admin / Quản trị viên cao nhất mới có quyền chỉnh sửa phân quyền!', 'warning');
    return;
  }
  const u = cachedUsers.find(x => x.id === userId);
  if (!u) { showToast('Không tìm thấy người dùng!', 'error'); return; }

  const currentPerms = u.permissions || [];
  const isSuper = currentPerms.includes('*');

  let groupsHTML = PERMISSION_MODULES.map(group => {
    let itemsHTML = group.items.map(item => {
      const checked = isSuper || currentPerms.includes(item.key) ? 'checked' : '';
      return `
        <label style="display:flex;align-items:center;gap:0.5rem;padding:0.45rem 0.6rem;background:var(--bg-main);border:1px solid var(--border-light);border-radius:var(--radius-md);cursor:pointer;font-size:0.825rem;transition:all 0.15s ease;">
          <input type="checkbox" class="user-perm-checkbox" value="${item.key}" ${checked}>
          <div>
            <div style="font-weight:600;color:var(--text-primary);">${escapeHTML(item.label)}</div>
            <code style="font-size:0.7rem;color:var(--primary-600);">${escapeHTML(item.key)}</code>
          </div>
        </label>
      `;
    }).join('');

    return `
      <div style="margin-bottom:1rem;background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:0.85rem;">
        <h4 style="font-size:0.875rem;font-weight:700;color:var(--primary-700);margin-bottom:0.6rem;display:flex;align-items:center;justify-content:space-between;">
          <span>${group.title}</span>
          <button type="button" class="btn btn-secondary btn-sm" style="padding:0.15rem 0.45rem;font-size:0.7rem;" onclick="toggleGroupPerms(this, true)">Chọn nhóm này</button>
        </h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:0.5rem;">
          ${itemsHTML}
        </div>
      </div>
    `;
  }).join('');

  showModal(`⚙️ Phân Quyền Trực Tiếp: ${escapeHTML(u.display_name)}`, `
    <form onsubmit="handleSaveUserPermissions(event, '${u.id}')">
      <div style="background:var(--info-bg);border:1px solid rgba(33,150,243,0.2);border-radius:var(--radius-md);padding:0.75rem;margin-bottom:1rem;font-size:0.825rem;color:var(--primary-700);">
        👤 Cấu hình chi tiết tính năng được phép truy cập cho <strong>${escapeHTML(u.display_name)}</strong> (${escapeHTML(u.email)}).
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;align-items:center;margin-bottom:1rem;">
        <div>
          <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:0.35rem;">Vai trò chính hệ thống</label>
          <select id="user-perm-role-select" onchange="applyRoleDefaultPermissions(this.value)">
            <option value="role_super_admin" ${u.role_id==='role_super_admin'?'selected':''}>Super Admin (Toàn quyền)</option>
            <option value="role_chu_nhiem" ${u.role_id==='role_chu_nhiem'?'selected':''}>Chủ nhiệm</option>
            <option value="role_pcn_thuong_truc" ${u.role_id==='role_pcn_thuong_truc'?'selected':''}>Phó Chủ nhiệm Thường trực</option>
            <option value="role_pho_chu_nhiem" ${u.role_id==='role_pho_chu_nhiem'?'selected':''}>Phó Chủ nhiệm</option>
            <option value="role_uy_vien_bcn" ${u.role_id==='role_uy_vien_bcn'?'selected':''}>Ủy viên Ban Chủ nhiệm</option>
            <option value="role_thu_ky" ${u.role_id==='role_thu_ky'?'selected':''}>Thư ký</option>
            <option value="role_thu_quy" ${u.role_id==='role_thu_quy'?'selected':''}>Thủ quỹ</option>
            <option value="role_thanh_vien" ${u.role_id==='role_thanh_vien'?'selected':''}>Thành viên</option>
            <option value="role_cong_tac_vien" ${u.role_id==='role_cong_tac_vien'?'selected':''}>Cộng tác viên</option>
          </select>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:1.4rem;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="selectAllUserPerms(true)">✅ Chọn tất cả</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="selectAllUserPerms(false)">❌ Bỏ chọn tất cả</button>
        </div>
      </div>

      <div style="max-height:420px;overflow-y:auto;padding-right:0.35rem;">
        ${groupsHTML}
      </div>

      <div style="margin-top:1rem;">
        <button type="submit" class="btn btn-primary btn-block">💾 Lưu Phân Quyền Cho User</button>
      </div>
    </form>
  `);
}

function selectAllUserPerms(status) {
  document.querySelectorAll('.user-perm-checkbox').forEach(cb => cb.checked = status);
}

function toggleGroupPerms(btn, status) {
  const container = btn.closest('div');
  container.querySelectorAll('.user-perm-checkbox').forEach(cb => cb.checked = status);
}

function applyRoleDefaultPermissions(roleId) {
  const roleMap = {
    'role_super_admin': ['*'],
    'role_chu_nhiem': ['users.read', 'users.create', 'users.update', 'users.delete', 'roles.manage', 'events.read', 'events.create', 'attendance.manage', 'articles.read', 'articles.create', 'articles.publish', 'quizzes.take', 'quizzes.create', 'certificates.view', 'certificates.issue', 'notifications.create'],
    'role_pcn_thuong_truc': ['users.read', 'users.create', 'users.update', 'events.read', 'events.create', 'attendance.manage', 'articles.read', 'articles.create', 'articles.publish', 'quizzes.take', 'quizzes.create', 'certificates.view', 'certificates.issue'],
    'role_pho_chu_nhiem': ['users.read', 'events.read', 'events.create', 'attendance.manage', 'articles.read', 'articles.create', 'articles.publish', 'quizzes.take', 'certificates.view'],
    'role_uy_vien_bcn': ['users.read', 'events.read', 'events.create', 'quizzes.take', 'certificates.view'],
    'role_thu_ky': ['users.read', 'articles.read', 'articles.create', 'notifications.create', 'certificates.view'],
    'role_thu_quy': ['users.read', 'certificates.view'],
    'role_thanh_vien': ['quizzes.take', 'events.read', 'articles.read', 'certificates.view'],
    'role_cong_tac_vien': ['events.read', 'articles.read']
  };

  const defaultPerms = roleMap[roleId] || ['quizzes.take'];
  const isSuper = defaultPerms.includes('*');

  document.querySelectorAll('.user-perm-checkbox').forEach(cb => {
    cb.checked = isSuper || defaultPerms.includes(cb.value);
  });
}

async function handleSaveUserPermissions(e, userId) {
  e.preventDefault();
  if (!canManagePermissions()) {
    showToast('🔒 Chỉ Super Admin / Quản trị viên cao nhất mới có quyền chỉnh sửa phân quyền!', 'error');
    return;
  }
  const roleId = document.getElementById('user-perm-role-select').value;
  const checkboxes = document.querySelectorAll('.user-perm-checkbox:checked');
  const selectedPerms = Array.from(checkboxes).map(cb => cb.value);

  try {
    const res = await apiFetch(`/api/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({
        role_id: roleId,
        permissions: roleId === 'role_super_admin' ? ['*'] : selectedPerms
      })
    });

    showToast(res.message || 'Cập nhật phân quyền người dùng thành công!', 'success');
    closeModal();
    loadUserPermissionsTable();
    loadRolesGrid();
    loadSystemLogs();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

// 3. System Activity Logs
async function loadSystemLogs() {
  const container = document.getElementById('system-logs-table-body');
  if (!container) return;
  try {
    const logs = await apiFetch('/api/logs');
    const list = Array.isArray(logs) ? logs : [];
    if (list.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="text-center">Chưa có nhật ký hoạt động.</td></tr>`;
      return;
    }

    container.innerHTML = list.map(l => `
      <tr>
        <td style="font-size:0.8rem;color:var(--text-muted);">${escapeHTML(l.timestamp)}</td>
        <td><strong>${escapeHTML(l.admin || 'Quản trị viên')}</strong></td>
        <td><span class="badge-active">${escapeHTML(l.action || 'SYS.ACTION')}</span></td>
        <td><span class="badge-role">${escapeHTML(l.module || 'Hệ thống')}</span></td>
        <td style="font-size:0.85rem;">${escapeHTML(l.detail)}</td>
      </tr>
    `).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Không thể tải nhật ký.</td></tr>`;
  }
}

// ========================================
// Modal
// ========================================
function showModal(title, contentHTML) {
  const modal = document.getElementById('global-modal');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  if (!modal) return;
  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = contentHTML;
  modal.style.display = 'flex';
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
  document.addEventListener('keydown', handleEscapeClose);
}
function closeModal() {
  const modal = document.getElementById('global-modal');
  if (modal) modal.style.display = 'none';
  document.removeEventListener('keydown', handleEscapeClose);
}
function handleEscapeClose(e) { if (e.key === 'Escape') closeModal(); }

// ========================================
// HTML Escape
// ========================================
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Expose globals
window.showView = showView;
window.showModal = showModal;
window.closeModal = closeModal;
window.escapeHTML = escapeHTML;
window.refreshCurrentView = refreshCurrentView;
window.loadOverviewStats = loadOverviewStats;
window.loadOverviewCertificates = loadOverviewCertificates;
window.openUserProfileModal = openUserProfileModal;
window.updateNotiBadge = updateNotiBadge;
window.loadUserPermissionsTable = loadUserPermissionsTable;
window.openUserPermissionsModal = openUserPermissionsModal;
window.handleSaveUserPermissions = handleSaveUserPermissions;
window.selectAllUserPerms = selectAllUserPerms;
window.toggleGroupPerms = toggleGroupPerms;
window.applyRoleDefaultPermissions = applyRoleDefaultPermissions;
window.openEditRolePermissionsModal = openEditRolePermissionsModal;
window.handleSaveRolePermissions = handleSaveRolePermissions;
window.loadSystemLogs = loadSystemLogs;

