/**
 * Sen Trắng Hub — Dashboard UI & Interactive Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Kiểm tra xác thực
  Auth.requireAuth();

  const currentUser = Auth.getUser();

  // Khởi tạo thông tin User trên Header & Sidebar
  initUserInfo(currentUser);

  // Khởi tạo Navigation chuyển View
  initNavigation();

  // Tải dữ liệu ban đầu
  loadOverviewStats();
  loadUsersTable();
  loadRolesGrid();

  // Event Listeners cho Modals & Forms
  initEventListeners();
});

// Hiển thị thông tin User
function initUserInfo(user) {
  if (!user) return;
  
  const userNameEls = document.querySelectorAll('.user-name');
  const userRoleEls = document.querySelectorAll('.user-role');
  const userAvatarEls = document.querySelectorAll('.user-avatar');

  userNameEls.forEach(el => el.textContent = user.display_name);
  userRoleEls.forEach(el => el.textContent = user.role_name || user.role_id);
  userAvatarEls.forEach(el => {
    const initial = user.display_name ? user.display_name.charAt(0).toUpperCase() : 'U';
    el.textContent = initial;
  });

  // Nút Logout
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => Auth.logout());
  }
}

// Điều hướng chuyển View (Tab)
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-view]');
  const viewSections = document.querySelectorAll('.view-section');
  const pageTitle = document.getElementById('page-title');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.getAttribute('data-view');

      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      viewSections.forEach(section => {
        if (section.id === `view-${targetView}`) {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });

      if (pageTitle) {
        pageTitle.textContent = item.innerText.trim();
      }
    });
  });
}

// Tải số liệu thống kê tổng quan
async function loadOverviewStats() {
  try {
    const users = await apiFetch('/api/users');
    const roles = await apiFetch('/api/roles');

    const totalUsersEl = document.getElementById('stat-total-users');
    const totalRolesEl = document.getElementById('stat-total-roles');
    const activeUsersEl = document.getElementById('stat-active-users');

    if (totalUsersEl) totalUsersEl.textContent = users.length;
    if (totalRolesEl) totalRolesEl.textContent = roles.length;
    if (activeUsersEl) {
      const activeCount = users.filter(u => u.is_active).length;
      activeUsersEl.textContent = activeCount;
    }
  } catch (err) {
    console.warn('Không thể tải thống kê:', err);
  }
}

// Tải danh sách Người dùng lên Bảng
async function loadUsersTable() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim);">Đang tải dữ liệu...</td></tr>`;

  try {
    const users = await apiFetch('/api/users');
    
    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim);">Chưa có người dùng nào.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map((u, index) => {
      const roleBadge = `<span class="badge badge-${u.role_id}">${u.role_name || u.role_id}</span>`;
      const statusBadge = u.is_active 
        ? `<span class="badge badge-active">Hoạt động</span>`
        : `<span class="badge badge-inactive">Bị khóa</span>`;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">${u.display_name.charAt(0).toUpperCase()}</div>
              <div>
                <div style="font-weight: 700; color: var(--text-main);">${u.display_name}</div>
                <div style="font-size: 0.75rem; color: var(--text-dim);">${u.email}</div>
              </div>
            </div>
          </td>
          <td>${roleBadge}</td>
          <td>${statusBadge}</td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}</td>
          <td>
            <button class="btn-sm btn-outline" onclick="openEditUserModal('${u.id}', '${u.display_name}', '${u.role_id}', ${u.is_active})">Sửa</button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-red);">Lỗi: ${err.message}</td></tr>`;
  }
}

// Tải lưới Vai trò & Phân quyền
async function loadRolesGrid() {
  const container = document.getElementById('roles-cards-container');
  if (!container) return;

  try {
    const roles = await apiFetch('/api/roles');
    
    container.innerHTML = roles.map(r => `
      <div class="card-box" style="margin-bottom: 0;">
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="badge badge-${r.id}" style="font-size: 0.9rem; padding: 0.35rem 0.85rem;">${r.name}</span>
            <span style="font-size: 0.75rem; color: var(--text-dim);">Level ${r.level}</span>
          </div>
          <button class="btn-sm btn-outline" onclick="openPermissionsModal('${r.id}', '${r.name}')">⚡ Cấu hình quyền</button>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${r.description}</p>
        <div style="font-size: 0.8rem; color: var(--primary-400); font-weight: 700;">
          ${r.permissions.length} quyền được gán
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<p style="color: var(--accent-red);">Lỗi nạp danh sách vai trò: ${err.message}</p>`;
  }
}

// Quản lý Modals
let selectedRoleId = null;

async function openPermissionsModal(roleId, roleName) {
  selectedRoleId = roleId;
  const modal = document.getElementById('modal-permissions');
  const title = document.getElementById('modal-role-name');
  const grid = document.getElementById('perm-checkbox-grid');

  if (!modal || !grid) return;

  title.textContent = roleName;
  grid.innerHTML = '<p style="color: var(--text-dim);">Đang nạp dữ liệu quyền...</p>';

  modal.classList.add('active');

  try {
    const [allPerms, roleDetail] = await Promise.all([
      apiFetch('/api/roles/permissions/all'),
      apiFetch(`/api/roles/${roleId}`)
    ]);

    const activePerms = new Set(roleDetail.permissions || []);

    grid.innerHTML = allPerms.map(p => {
      const isChecked = activePerms.has(p.id) ? 'checked' : '';
      return `
        <label class="perm-item">
          <input type="checkbox" value="${p.id}" ${isChecked}>
          <div>
            <div style="font-weight: 600;">${p.id}</div>
            <div style="font-size: 0.7rem; color: var(--text-dim);">${p.description}</div>
          </div>
        </label>
      `;
    }).join('');

  } catch (err) {
    grid.innerHTML = `<p style="color: var(--accent-red);">Lỗi: ${err.message}</p>`;
  }
}

async function savePermissions() {
  if (!selectedRoleId) return;
  
  const checkboxes = document.querySelectorAll('#perm-checkbox-grid input[type="checkbox"]:checked');
  const selectedPerms = Array.from(checkboxes).map(cb => cb.value);

  try {
    await apiFetch(`/api/roles/${selectedRoleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions: selectedPerms })
    });

    showToast('Đã cập nhật cây phân quyền thành công!', 'success');
    closeModal('modal-permissions');
    loadRolesGrid();
  } catch (err) {
    showToast(err.message || 'Lỗi cập nhật phân quyền', 'error');
  }
}

function openEditUserModal(userId, name, currentRole, isActive) {
  const modal = document.getElementById('modal-edit-user');
  if (!modal) return;

  document.getElementById('edit-user-id').value = userId;
  document.getElementById('edit-user-name').textContent = name;
  document.getElementById('edit-user-role').value = currentRole;
  document.getElementById('edit-user-active').checked = isActive;

  modal.classList.add('active');
}

async function saveUserEdit() {
  const userId = document.getElementById('edit-user-id').value;
  const roleId = document.getElementById('edit-user-role').value;
  const isActive = document.getElementById('edit-user-active').checked;

  try {
    await apiFetch(`/api/users/${userId}?role_id=${roleId}&is_active=${isActive}`, {
      method: 'PUT',
      body: JSON.stringify({})
    });

    showToast('Đã cập nhật tài khoản thành công!', 'success');
    closeModal('modal-edit-user');
    loadUsersTable();
  } catch (err) {
    showToast(err.message || 'Cập nhật thất bại', 'error');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function initEventListeners() {
  const btnSavePerms = document.getElementById('btn-save-permissions');
  if (btnSavePerms) btnSavePerms.addEventListener('click', savePermissions);

  const btnSaveUser = document.getElementById('btn-save-user');
  if (btnSaveUser) btnSaveUser.addEventListener('click', saveUserEdit);

  // Close buttons
  document.querySelectorAll('.btn-close, .btn-modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });
}

window.openPermissionsModal = openPermissionsModal;
window.openEditUserModal = openEditUserModal;
window.closeModal = closeModal;
