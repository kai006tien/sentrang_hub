/**
 * Sen Trắng Hub — Members & HR Module
 * Handles: Member List, Create, Detail View
 */

async function loadMembersList() {
  const container = document.getElementById('users-table-body');
  if (!container) return;

  container.innerHTML = `<tr><td colspan="5" class="text-center">Đang tải danh sách thành viên...</td></tr>`;

  try {
    const res = await API.get('/members');
    // Handle both {data: []} and direct array responses
    const members = res.data || (Array.isArray(res) ? res : []);

    if (members.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="text-center">Chưa có dữ liệu thành viên. Bấm "+ Thêm thành viên" để khởi tạo.</td></tr>`;
      return;
    }

    const avatarColors = ['#1E88E5', '#00C853', '#FF6D00', '#7C4DFF', '#FF1744', '#00BCD4'];

    container.innerHTML = members.map((m, i) => {
      const color = avatarColors[i % avatarColors.length];
      const initial = m.full_name ? m.full_name.charAt(0).toUpperCase() : 'M';
      const statusClass = m.status === 'inactive' ? 'badge-inactive' : 'badge-active';
      const statusText = m.status === 'inactive' ? 'Tạm nghỉ' : 'Hoạt động';

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:0.65rem;">
              <div style="width:36px; height:36px; border-radius:50%; background:${color}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; flex-shrink:0;">
                ${initial}
              </div>
              <div>
                <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem;">${escapeHTML(m.full_name)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(m.generation || 'Gen 1')} • ${escapeHTML(m.department || 'Ban Chuyên môn')}</div>
              </div>
            </div>
          </td>
          <td style="font-size:0.85rem;">${escapeHTML(m.email)}</td>
          <td><span class="badge-role">${escapeHTML(m.current_position || 'Thành viên')}</span></td>
          <td><span class="${statusClass}">${statusText}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="viewMemberDetail('${m.id}')">Xem hồ sơ</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi tải dữ liệu: ${escapeHTML(err.message)}</td></tr>`;
    console.error('loadMembersList error:', err);
  }
}

function openCreateUserModal() {
  const modalHTML = `
    <form id="create-member-form" onsubmit="handleCreateMemberSubmit(event)">
      <div style="margin-bottom:0.85rem;">
        <label>Họ và tên thành viên *</label>
        <input type="text" id="mem-name" required placeholder="Nguyễn Văn A">
      </div>
      <div style="margin-bottom:0.85rem;">
        <label>Email đăng nhập *</label>
        <input type="email" id="mem-email" required placeholder="thanhvien@sentranghub.vn">
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; margin-bottom:0.85rem;">
        <div>
          <label>Mã số sinh viên (MSSV)</label>
          <input type="text" id="mem-student-id" placeholder="2026001">
        </div>
        <div>
          <label>Thế hệ (Gen)</label>
          <select id="mem-gen">
            <option value="Gen 12">Gen 12</option>
            <option value="Gen 11">Gen 11</option>
            <option value="Gen 10">Gen 10</option>
            <option value="Gen 1">Gen 1</option>
          </select>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; margin-bottom:1.25rem;">
        <div>
          <label>Ban chuyên môn</label>
          <select id="mem-dept">
            <option value="Ban Phong trào">Ban Phong trào</option>
            <option value="Ban Truyền thông">Ban Truyền thông</option>
            <option value="Ban Chuyên môn">Ban Chuyên môn</option>
            <option value="Ban Chủ nhiệm">Ban Chủ nhiệm</option>
          </select>
        </div>
        <div>
          <label>Chức danh</label>
          <select id="mem-pos">
            <option value="Thành viên">Thành viên</option>
            <option value="Cộng tác viên">Cộng tác viên</option>
            <option value="Thư ký">Thư ký</option>
            <option value="Ủy viên BCN">Ủy viên BCN</option>
            <option value="Phó Chủ nhiệm">Phó Chủ nhiệm</option>
            <option value="Chủ nhiệm">Chủ nhiệm</option>
          </select>
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">✨ Tạo Hồ Sơ Thành Viên</button>
    </form>
  `;
  showModal('Tạo Hồ Sơ Nhân Sự Mới', modalHTML);
}

async function handleCreateMemberSubmit(e) {
  e.preventDefault();
  const payload = {
    full_name: document.getElementById('mem-name').value,
    email: document.getElementById('mem-email').value,
    student_id: document.getElementById('mem-student-id').value,
    generation: document.getElementById('mem-gen').value,
    department: document.getElementById('mem-dept').value,
    current_position: document.getElementById('mem-pos').value
  };

  try {
    const res = await API.post('/members', payload);
    showToast(res.message || 'Tạo thành viên mới thành công!', 'success');
    closeModal();
    loadMembersList();
  } catch (err) {
    showToast('Lỗi: ' + (err.message || 'Không thể tạo thành viên'), 'error');
    console.error('handleCreateMemberSubmit error:', err);
  }
}

async function viewMemberDetail(memberId) {
  try {
    const res = await API.get(`/members/${memberId}`);
    const data = res.data || res;
    const profile = data.profile;
    const extPositions = data.external_positions || [];
    const posHistory = data.position_history || [];

    const modalContent = `
      <div style="padding:0.25rem;">
        <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.25rem;">
          <div style="width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg, #1E88E5, #0D47A1); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.4rem; flex-shrink:0;">
            ${profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div>
            <h3 style="font-size:1.2rem; font-weight:700; color:var(--text-primary); margin:0 0 0.2rem;">${escapeHTML(profile.full_name)}</h3>
            <p style="font-size:0.825rem; color:var(--text-muted); margin:0;">MSSV: ${escapeHTML(profile.student_id || 'N/A')} • ${escapeHTML(profile.generation || 'Gen 1')} • ${escapeHTML(profile.department || 'Ban Chuyên môn')}</p>
          </div>
        </div>
        
        <div style="background:var(--bg-main); padding:1rem; border-radius:var(--radius-md); margin-bottom:1rem; border:1px solid var(--border-light);">
          <h4 style="font-size:0.85rem; font-weight:700; color:var(--primary-700); margin-bottom:0.6rem;">🏢 Chức vụ kiêm nhiệm ngoài CLB</h4>
          ${extPositions.length ? extPositions.map(ep => `<div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.3rem;">• <strong>${escapeHTML(ep.position)}</strong> tại <em>${escapeHTML(ep.organization)}</em></div>`).join('') : '<div style="font-size:0.85rem; color:var(--text-muted);">Chưa ghi nhận chức vụ kiêm nhiệm.</div>'}
        </div>

        <div style="background:var(--success-bg); padding:1rem; border-radius:var(--radius-md); border:1px solid rgba(0,200,83,0.2);">
          <h4 style="font-size:0.85rem; font-weight:700; color:#1B5E20; margin-bottom:0.6rem;">⏳ Lịch sử thăng tiến nội bộ</h4>
          ${posHistory.length ? posHistory.map(ph => `<div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.3rem;">• <strong>${escapeHTML(ph.role_id)}</strong> (${escapeHTML(ph.start_date)} → ${ph.end_date || 'Hiện tại'})</div>`).join('') : '<div style="font-size:0.85rem; color:var(--text-muted);">Đang ở mốc bổ nhiệm ban đầu.</div>'}
        </div>

        <div style="margin-top:1.25rem; text-align:right;">
          <button class="btn btn-primary btn-sm" onclick="issueCertificateModal('${profile.id}')">🎖️ Xuất Chứng nhận</button>
        </div>
      </div>
    `;

    showModal('Hồ sơ Nhân sự Chi tiết', modalContent);
  } catch (err) {
    showToast('Lỗi tải hồ sơ: ' + err.message, 'error');
    console.error('viewMemberDetail error:', err);
  }
}

// Expose to global scope
window.loadMembersList = loadMembersList;
window.openCreateUserModal = openCreateUserModal;
window.handleCreateMemberSubmit = handleCreateMemberSubmit;
window.viewMemberDetail = viewMemberDetail;
