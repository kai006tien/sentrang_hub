/**
 * Sen Trắng Hub v2 — Members & HR Module
 * Features: List, Create, Detail, Create Account, Assign Role
 */

async function loadMembersList() {
  const container = document.getElementById('users-table-body');
  const actionsContainer = document.getElementById('users-action-buttons');
  if (!container) return;

  // Permission-based action buttons
  if (actionsContainer) {
    let btns = '';
    if (hasPermission('users.create') || isSuperAdmin()) {
      btns += `<button class="btn btn-primary btn-sm" onclick="openCreateUserModal()">+ Thêm thành viên</button>`;
      btns += `<button class="btn btn-secondary btn-sm" onclick="openCreateAccountModal()">🔑 Cấp tài khoản</button>`;
    }
    actionsContainer.innerHTML = btns;
  }

  container.innerHTML = `<tr><td colspan="5" class="text-center">Đang tải...</td></tr>`;
  try {
    const res = await API.get('/members');
    const members = res.data || (Array.isArray(res) ? res : []);
    if (members.length === 0) { container.innerHTML = `<tr><td colspan="5" class="text-center">Chưa có dữ liệu.</td></tr>`; return; }

    const colors = ['#1E88E5','#00C853','#FF6D00','#7C4DFF','#FF1744','#00BCD4'];
    container.innerHTML = members.map((m,i) => {
      const color = colors[i % colors.length];
      const initial = (m.full_name||'M').charAt(0).toUpperCase();
      const statusClass = m.status === 'inactive' ? 'badge-inactive' : 'badge-active';
      const statusText = m.status === 'inactive' ? 'Tạm nghỉ' : 'Hoạt động';
      const canManage = hasPermission('users.create') || isSuperAdmin();

      return `<tr>
        <td><div style="display:flex;align-items:center;gap:0.65rem;">
          <div style="width:36px;height:36px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;">${initial}</div>
          <div><div style="font-weight:700;font-size:0.9rem;">${escapeHTML(m.full_name)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHTML(m.generation||'')} • ${escapeHTML(m.department||'')}</div></div>
        </div></td>
        <td style="font-size:0.85rem;">${escapeHTML(m.email)}</td>
        <td><span class="badge-role">${escapeHTML(m.current_position||'Thành viên')}</span></td>
        <td><span class="${statusClass}">${statusText}</span></td>
        <td><div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="viewMemberDetail('${m.id}')">Xem</button>
          ${canManage ? `<button class="btn btn-secondary btn-sm" onclick="openAssignRoleModal('${m.user_id||''}','${escapeHTML(m.full_name)}')">🛡️ Quyền</button>` : ''}
        </div></td>
      </tr>`;
    }).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</td></tr>`;
  }
}

function openCreateUserModal() {
  showModal('Tạo Hồ Sơ Nhân Sự Mới', `
    <form onsubmit="handleCreateMemberSubmit(event)">
      <div style="margin-bottom:0.85rem;"><label>Họ và tên *</label><input type="text" id="mem-name" required placeholder="Nguyễn Văn A"></div>
      <div style="margin-bottom:0.85rem;"><label>Email *</label><input type="email" id="mem-email" required placeholder="thanhvien@sentranghub.vn"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:0.85rem;">
        <div><label>MSSV</label><input type="text" id="mem-student-id" placeholder="2026001"></div>
        <div><label>Thế hệ</label><select id="mem-gen"><option>Gen 12</option><option>Gen 11</option><option>Gen 10</option></select></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:1.25rem;">
        <div><label>Ban</label><select id="mem-dept"><option>Ban Phong trào</option><option>Ban Truyền thông</option><option>Ban Chuyên môn</option><option>Ban Chủ nhiệm</option></select></div>
        <div><label>Chức danh</label><select id="mem-pos"><option>Thành viên</option><option>Phó Chủ nhiệm</option><option>Chủ nhiệm</option><option>Trưởng ban</option><option>Thư ký</option></select></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">✨ Tạo Hồ Sơ</button>
    </form>`);
}

async function handleCreateMemberSubmit(e) {
  e.preventDefault();
  try {
    const res = await API.post('/members', {
      full_name: document.getElementById('mem-name').value,
      email: document.getElementById('mem-email').value,
      student_id: document.getElementById('mem-student-id').value,
      generation: document.getElementById('mem-gen').value,
      department: document.getElementById('mem-dept').value,
      current_position: document.getElementById('mem-pos').value
    });
    showToast(res.message || 'Tạo thành viên thành công!', 'success');
    closeModal(); loadMembersList();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

// === CREATE LOGIN ACCOUNT ===
function openCreateAccountModal() {
  showModal('🔑 Cấp Tài Khoản Đăng Nhập', `
    <form onsubmit="handleCreateAccountSubmit(event)">
      <div style="background:var(--info-bg);border:1px solid rgba(33,150,243,0.2);border-radius:var(--radius-md);padding:0.75rem;margin-bottom:1rem;font-size:0.825rem;color:var(--primary-700);">
        ℹ️ Tạo tài khoản đăng nhập cho thành viên. Thành viên sẽ dùng email + mật khẩu được cấp để truy cập hệ thống.
      </div>
      <div style="margin-bottom:0.85rem;"><label>Họ tên hiển thị *</label><input type="text" id="acc-name" required placeholder="Nguyễn Văn A"></div>
      <div style="margin-bottom:0.85rem;"><label>Email đăng nhập *</label><input type="email" id="acc-email" required placeholder="member@sentranghub.vn"></div>
      <div style="margin-bottom:0.85rem;"><label>Mật khẩu *</label><input type="text" id="acc-pass" required value="User@2026!" placeholder="Mật khẩu mặc định"></div>
      <div style="margin-bottom:1.25rem;">
        <label>Vai trò được gán *</label>
        <select id="acc-role">
          <option value="role_thanh_vien">Thành viên</option>
          <option value="role_truong_ban">Trưởng ban</option>
          <option value="role_pho_chu_nhiem">Phó Chủ nhiệm</option>
          <option value="role_chu_nhiem">Chủ nhiệm</option>
          <option value="role_thu_quy">Thủ quỹ</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-block">🔑 Tạo Tài Khoản & Cấp Quyền</button>
    </form>`);
}

async function handleCreateAccountSubmit(e) {
  e.preventDefault();
  try {
    const res = await API.post('/users/create-account', {
      display_name: document.getElementById('acc-name').value,
      email: document.getElementById('acc-email').value,
      password: document.getElementById('acc-pass').value,
      role_id: document.getElementById('acc-role').value
    });
    showToast(res.message || 'Tạo tài khoản thành công!', 'success');
    closeModal(); loadMembersList();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

// === ASSIGN ROLE ===
async function openAssignRoleModal(userId, memberName) {
  if (!userId) { showToast('Thành viên chưa có tài khoản đăng nhập. Hãy cấp tài khoản trước.', 'warning'); return; }
  try {
    const roles = await apiFetch('/api/roles');
    const roleList = Array.isArray(roles) ? roles : [];
    showModal(`🛡️ Phân quyền: ${memberName}`, `
      <div style="margin-bottom:1rem;font-size:0.85rem;color:var(--text-secondary);">Chọn vai trò mới cho <strong>${escapeHTML(memberName)}</strong>:</div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.25rem;">
        ${roleList.map(r => `
          <label style="display:flex;align-items:center;gap:0.6rem;padding:0.7rem;background:var(--bg-main);border:1.5px solid var(--border-light);border-radius:var(--radius-md);cursor:pointer;transition:all 0.2s ease;" onmouseenter="this.style.borderColor='var(--primary-300)'" onmouseleave="this.style.borderColor='var(--border-light)'">
            <input type="radio" name="new-role" value="${r.id}">
            <div><div style="font-weight:700;font-size:0.9rem;">${escapeHTML(r.name)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHTML(r.description)}</div></div>
          </label>
        `).join('')}
      </div>
      <button class="btn btn-primary btn-block" onclick="handleAssignRole('${userId}')">✅ Cập nhật Vai trò</button>
    `);
  } catch (err) { showToast('Lỗi tải vai trò: ' + err.message, 'error'); }
}

async function handleAssignRole(userId) {
  const selected = document.querySelector('input[name="new-role"]:checked');
  if (!selected) { showToast('Vui lòng chọn vai trò!', 'warning'); return; }
  try {
    const res = await API.put(`/users/${userId}/role`, { role_id: selected.value });
    showToast(res.message || 'Cập nhật quyền thành công!', 'success');
    closeModal(); loadMembersList();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

// === MEMBER DETAIL ===
async function viewMemberDetail(memberId) {
  try {
    const res = await API.get(`/members/${memberId}`);
    const data = res.data || res;
    const p = data.profile;
    const ext = data.external_positions || [];
    const hist = data.position_history || [];
    showModal('Hồ sơ Chi tiết', `
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem;">
        <div style="width:56px;height:56px;border-radius:50%;background:var(--primary-gradient);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.4rem;">${(p.full_name||'M').charAt(0).toUpperCase()}</div>
        <div><h3 style="font-size:1.2rem;font-weight:700;margin:0;">${escapeHTML(p.full_name)}</h3>
        <p style="font-size:0.825rem;color:var(--text-muted);margin:0;">MSSV: ${escapeHTML(p.student_id||'N/A')} • ${escapeHTML(p.generation||'')} • ${escapeHTML(p.department||'')}</p></div>
      </div>
      <div style="background:var(--bg-main);padding:1rem;border-radius:var(--radius-md);margin-bottom:1rem;border:1px solid var(--border-light);">
        <h4 style="font-size:0.85rem;font-weight:700;color:var(--primary-700);margin-bottom:0.5rem;">🏢 Chức vụ kiêm nhiệm</h4>
        ${ext.length ? ext.map(e=>`<div style="font-size:0.85rem;margin-bottom:0.2rem;">• <strong>${escapeHTML(e.position)}</strong> tại <em>${escapeHTML(e.organization)}</em></div>`).join('') : '<div style="font-size:0.85rem;color:var(--text-muted);">Chưa ghi nhận.</div>'}
      </div>
      <div style="background:var(--success-bg);padding:1rem;border-radius:var(--radius-md);border:1px solid rgba(0,200,83,0.2);">
        <h4 style="font-size:0.85rem;font-weight:700;color:#1B5E20;margin-bottom:0.5rem;">⏳ Lịch sử thăng tiến</h4>
        ${hist.length ? hist.map(h=>`<div style="font-size:0.85rem;margin-bottom:0.2rem;">• <strong>${escapeHTML(h.role_id)}</strong> (${escapeHTML(h.start_date)} → ${h.end_date||'Hiện tại'})</div>`).join('') : '<div style="font-size:0.85rem;color:var(--text-muted);">Đang ở mốc ban đầu.</div>'}
      </div>
    `);
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

window.loadMembersList = loadMembersList;
window.openCreateUserModal = openCreateUserModal;
window.handleCreateMemberSubmit = handleCreateMemberSubmit;
window.openCreateAccountModal = openCreateAccountModal;
window.handleCreateAccountSubmit = handleCreateAccountSubmit;
window.openAssignRoleModal = openAssignRoleModal;
window.handleAssignRole = handleAssignRole;
window.viewMemberDetail = viewMemberDetail;
