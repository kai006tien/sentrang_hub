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
    'events':'Sự kiện & Điểm danh QR', 'leaderboard':'Vinh danh & Chứng nhận',
    'articles':'Truyền thông CMS', 'quizzes':'Thi trực tuyến', 'notifications':'Thông báo hệ thống'
  };
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = titleMap[viewId] || 'Dashboard';

  switch (viewId) {
    case 'overview': loadOverviewStats(); loadLatestNews(); break;
    case 'users': if (typeof loadMembersList === 'function') loadMembersList(); break;
    case 'events': if (typeof loadEventsList === 'function') loadEventsList(); break;
    case 'leaderboard': if (typeof loadLeaderboard === 'function') loadLeaderboard(); break;
    case 'articles': if (typeof loadArticlesList === 'function') loadArticlesList(); break;
    case 'quizzes': if (typeof loadQuizzesList === 'function') loadQuizzesList(); break;
    case 'notifications': if (typeof loadNotificationsList === 'function') loadNotificationsList(); break;
    case 'roles': loadRolesGrid(); break;
  }
}

function refreshCurrentView() {
  showView(currentView);
  showToast('Đã làm mới dữ liệu!', 'success');
}

// ========================================
// Overview Stats
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
// Notification Badge
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

// ========================================
// Roles Grid
// ========================================
async function loadRolesGrid() {
  const container = document.getElementById('roles-cards-container');
  if (!container) return;
  try {
    const roles = await apiFetch('/api/roles');
    const roleList = Array.isArray(roles) ? roles : [];
    if (roleList.length === 0) { container.innerHTML = '<div class="text-center">Chưa có vai trò nào.</div>'; return; }

    const levelColors = { 0:{bg:'#FFEBEE',border:'#EF5350',text:'#C62828'}, 1:{bg:'#FFF3E0',border:'#FF9800',text:'#E65100'}, 2:{bg:'#E3F2FD',border:'#42A5F5',text:'#0D47A1'}, 3:{bg:'#F3E5F5',border:'#AB47BC',text:'#6A1B9A'}, 10:{bg:'#E8F5E9',border:'#66BB6A',text:'#1B5E20'} };
    container.innerHTML = roleList.map(r => {
      const c = levelColors[r.level] || levelColors[10];
      const permList = r.permissions.includes('*') ? 'Toàn quyền hệ thống' : r.permissions.join(', ');
      return `<div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:1.25rem;box-shadow:var(--shadow-sm);border-left:4px solid ${c.border};">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
          <span style="font-size:0.8rem;padding:0.2rem 0.65rem;background:${c.bg};color:${c.text};font-weight:700;border-radius:var(--radius-full);">${escapeHTML(r.name)}</span>
          <span style="font-size:0.7rem;color:var(--text-muted);font-weight:600;">Level ${r.level}</span>
        </div>
        <p style="font-size:0.825rem;color:var(--text-secondary);margin-bottom:0.75rem;">${escapeHTML(r.description)}</p>
        <div style="font-size:0.75rem;color:var(--primary-600);font-weight:600;">🔑 ${permList}</div>
      </div>`;
    }).join('');
  } catch (err) { container.innerHTML = `<div class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</div>`; }
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
window.updateNotiBadge = updateNotiBadge;
