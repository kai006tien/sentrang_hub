/**
 * Sen Trắng Hub — Dashboard Controller
 * Handles: Navigation, Stats Loading, Roles Grid, User Info, Modals
 */

document.addEventListener('DOMContentLoaded', () => {
  // Auth check (single call, no duplicate)
  Auth.requireAuth();

  const currentUser = Auth.getUser();

  // Init user info in header
  initUserInfo(currentUser);

  // Init navigation (unified click handler)
  initNavigation();

  // Load initial data
  loadOverviewStats();
  loadRolesGrid();

  // Logout handler
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => Auth.logout());
  }

  // Live clock
  updateClock();
  setInterval(updateClock, 1000);
});

// ========================================
// User Info Display
// ========================================
function initUserInfo(user) {
  if (!user) return;

  const displayNameEl = document.getElementById('user-display-name');
  const roleBadgeEl = document.getElementById('user-role-badge');
  const avatarEl = document.getElementById('user-avatar');

  if (displayNameEl) displayNameEl.textContent = user.display_name || 'Người dùng';
  if (roleBadgeEl) roleBadgeEl.textContent = user.role_name || user.role_id || 'Thành viên';
  if (avatarEl) {
    const initial = user.display_name ? user.display_name.charAt(0).toUpperCase() : 'U';
    avatarEl.textContent = initial;
  }
}

// ========================================
// Live Clock
// ========================================
function updateClock() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const clockEl = document.getElementById('clock-text');
  if (clockEl) clockEl.textContent = now.toLocaleDateString('vi-VN', options);
}

// ========================================
// Navigation — Unified handler
// ========================================
let currentView = 'overview';

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-view]');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');
      showView(targetView);
    });
  });
}

function showView(viewId) {
  currentView = viewId;

  // Update sections
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) targetView.classList.add('active');

  const targetNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (targetNav) targetNav.classList.add('active');

  // Update title
  const titleMap = {
    'overview': 'Tổng quan hệ thống',
    'users': 'Hồ sơ Nhân sự',
    'roles': 'Phân quyền & System Log',
    'events': 'Sự kiện & Điểm danh QR',
    'leaderboard': 'Vinh danh & Xếp hạng',
    'articles': 'Truyền thông CMS',
    'quizzes': 'Đào tạo & Trắc nghiệm'
  };
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = titleMap[viewId] || 'Dashboard';

  // Load data for the target view
  switch (viewId) {
    case 'overview':
      loadOverviewStats();
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
    case 'articles':
      if (typeof loadArticlesList === 'function') loadArticlesList();
      break;
    case 'quizzes':
      if (typeof loadQuizzesList === 'function') loadQuizzesList();
      break;
    case 'roles':
      loadRolesGrid();
      break;
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

    const totalUsersEl = document.getElementById('stat-total-users');
    const totalRolesEl = document.getElementById('stat-total-roles');
    const activeUsersEl = document.getElementById('stat-active-users');

    const userList = Array.isArray(users) ? users : [];

    if (totalUsersEl) totalUsersEl.textContent = userList.length;
    if (totalRolesEl) totalRolesEl.textContent = Array.isArray(roles) ? roles.length : 0;
    if (activeUsersEl) {
      const activeCount = userList.filter(u => u.is_active).length;
      activeUsersEl.textContent = activeCount;
    }
  } catch (err) {
    console.warn('Không thể tải thống kê:', err);
  }
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

    if (roleList.length === 0) {
      container.innerHTML = '<div class="text-center">Chưa có vai trò nào.</div>';
      return;
    }

    const levelColors = {
      0: { bg: '#FFEBEE', border: '#EF5350', text: '#C62828' },
      1: { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' },
      2: { bg: '#E3F2FD', border: '#42A5F5', text: '#0D47A1' },
      3: { bg: '#F3E5F5', border: '#AB47BC', text: '#6A1B9A' },
      10: { bg: '#E8F5E9', border: '#66BB6A', text: '#1B5E20' }
    };

    container.innerHTML = roleList.map(r => {
      const colors = levelColors[r.level] || levelColors[10];
      return `
        <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-lg); padding:1.25rem; box-shadow:var(--shadow-sm); border-left:4px solid ${colors.border};">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:0.8rem; padding:0.2rem 0.65rem; background:${colors.bg}; color:${colors.text}; font-weight:700; border-radius:var(--radius-full);">${escapeHTML(r.name)}</span>
              <span style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">Level ${r.level}</span>
            </div>
          </div>
          <p style="font-size:0.825rem; color:var(--text-secondary); margin-bottom:0.75rem; line-height:1.5;">${escapeHTML(r.description)}</p>
          <div style="font-size:0.75rem; color:var(--primary-600); font-weight:700;">
            🔑 ${r.permissions.length} quyền được gán
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</div>`;
  }
}

// ========================================
// Modal System (Single, unified)
// ========================================
function showModal(title, contentHTML) {
  const modal = document.getElementById('global-modal');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');

  if (!modal || !titleEl || !bodyEl) return;

  titleEl.textContent = title;
  bodyEl.innerHTML = contentHTML;
  modal.style.display = 'flex';

  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // Close on Escape key
  document.addEventListener('keydown', handleEscapeClose);
}

function closeModal() {
  const modal = document.getElementById('global-modal');
  if (modal) modal.style.display = 'none';
  document.removeEventListener('keydown', handleEscapeClose);
}

function handleEscapeClose(e) {
  if (e.key === 'Escape') closeModal();
}

// ========================================
// HTML Escape Utility
// ========================================
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ========================================
// Expose globals
// ========================================
window.showView = showView;
window.showModal = showModal;
window.closeModal = closeModal;
window.escapeHTML = escapeHTML;
window.refreshCurrentView = refreshCurrentView;
window.loadOverviewStats = loadOverviewStats;
