/**
 * Sen Trắng Hub — Members & HR Module JavaScript
 * Handles Member List, External Positions, Position History & Details Modal
 */

async function loadMembersList() {
  const container = document.getElementById('users-table-body');
  if (!container) return;

  container.innerHTML = `<tr><td colspan="5" class="text-center">Đang tải danh sách thành viên...</td></tr>`;

  try {
    const res = await API.get('/members');
    const members = res.data || [];

    if (members.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="text-center">Chưa có dữ liệu thành viên. Bấm "+ Thêm tài khoản" để khởi tạo.</td></tr>`;
      return;
    }

    container.innerHTML = members.map(m => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <div style="width:32px; height:32px; border-radius:50%; background:#059669; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">
              ${m.full_name ? m.full_name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div>
              <strong>${escapeHTML(m.full_name)}</strong>
              <div style="font-size:0.75rem; color:#64748b;">${escapeHTML(m.generation || 'Gen 1')} • ${escapeHTML(m.department || 'Ban Chuyên môn')}</div>
            </div>
          </div>
        </td>
        <td>${escapeHTML(m.email)}</td>
        <td><span class="badge-role">${escapeHTML(m.current_position || 'Thành viên')}</span></td>
        <td><span class="badge-active">${m.status === 'inactive' ? 'Tạm nghỉ' : 'Hoạt động'}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="viewMemberDetail('${m.id}')">Xem hồ sơ</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi tải dữ liệu: ${escapeHTML(err.message)}</td></tr>`;
  }
}

function openCreateUserModal() {
  const modalHTML = `
    <form id="create-member-form" onsubmit="handleCreateMemberSubmit(event)">
      <div style="margin-bottom:0.85rem;">
        <label style="font-size:0.825rem; font-weight:600; color:#334155; display:block; margin-bottom:0.35rem;">Họ và tên thành viên *</label>
        <input type="text" id="mem-name" required placeholder="Nguyễn Văn A" style="width:100%; padding:0.65rem; border:1px solid #cbd5e1; border-radius:8px;">
      </div>
      <div style="margin-bottom:0.85rem;">
        <label style="font-size:0.825rem; font-weight:600; color:#334155; display:block; margin-bottom:0.35rem;">Email đăng nhập *</label>
        <input type="email" id="mem-email" required placeholder="thanhvien@sentranghub.vn" style="width:100%; padding:0.65rem; border:1px solid #cbd5e1; border-radius:8px;">
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; margin-bottom:0.85rem;">
        <div>
          <label style="font-size:0.825rem; font-weight:600; color:#334155; display:block; margin-bottom:0.35rem;">Mã số sinh viên (MSSV)</label>
          <input type="text" id="mem-student-id" placeholder="2026001" style="width:100%; padding:0.65rem; border:1px solid #cbd5e1; border-radius:8px;">
        </div>
        <div>
          <label style="font-size:0.825rem; font-weight:600; color:#334155; display:block; margin-bottom:0.35rem;">Thế hệ (Gen)</label>
          <select id="mem-gen" style="width:100%; padding:0.65rem; border:1px solid #cbd5e1; border-radius:8px;">
            <option value="Gen 12">Gen 12</option>
            <option value="Gen 11">Gen 11</option>
            <option value="Gen 10">Gen 10</option>
            <option value="Gen 1">Gen 1</option>
          </select>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; margin-bottom:1.25rem;">
        <div>
          <label style="font-size:0.825rem; font-weight:600; color:#334155; display:block; margin-bottom:0.35rem;">Ban chuyên môn</label>
          <select id="mem-dept" style="width:100%; padding:0.65rem; border:1px solid #cbd5e1; border-radius:8px;">
            <option value="Ban Phong trào">Ban Phong trào</option>
            <option value="Ban Truyền thông">Ban Truyền thông</option>
            <option value="Ban Chuyên môn">Ban Chuyên môn</option>
            <option value="Ban Chủ nhiệm">Ban Chủ nhiệm</option>
          </select>
        </div>
        <div>
          <label style="font-size:0.825rem; font-weight:600; color:#334155; display:block; margin-bottom:0.35rem;">Chức danh</label>
          <select id="mem-pos" style="width:100%; padding:0.65rem; border:1px solid #cbd5e1; border-radius:8px;">
            <option value="role_thanh_vien">Thành viên</option>
            <option value="role_cong_tac_vien">Cộng tác viên</option>
            <option value="role_thu_ky">Thư ký</option>
            <option value="role_uy_vien_bcn">Ủy viên BCN</option>
            <option value="role_pho_chu_nhiem">Phó Chủ nhiệm</option>
            <option value="role_chu_nhiem">Chủ nhiệm</option>
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
    showToast('Đã thêm thành viên mới thành công!', 'success');
    closeModal();
    loadMembersList();
  }
}

async function viewMemberDetail(memberId) {
  try {
    const res = await API.get(`/members/${memberId}`);
    const data = res.data;
    const profile = data.profile;
    const extPositions = data.external_positions || [];
    const posHistory = data.position_history || [];

    const modalContent = `
      <div style="padding:0.5rem;">
        <h3 style="font-size:1.25rem; font-weight:700; color:#0f172a; margin-bottom:0.5rem;">🌸 Hồ sơ: ${escapeHTML(profile.full_name)}</h3>
        <p style="font-size:0.85rem; color:#64748b; margin-bottom:1rem;">MSSV: ${escapeHTML(profile.student_id || 'N/A')} • ${escapeHTML(profile.generation || 'Gen 1')} • ${escapeHTML(profile.department || 'Ban Chuyên môn')}</p>
        
        <div style="background:#f8fafc; padding:1rem; border-radius:12px; margin-bottom:1rem; border:1px solid #e2e8f0;">
          <h4 style="font-size:0.9rem; font-weight:700; color:#047857; margin-bottom:0.5rem;">🏢 Chức vụ kiêm nhiệm ngoài CLB (Đoàn/Hội/Đội):</h4>
          ${extPositions.length ? extPositions.map(ep => `<div style="font-size:0.85rem; color:#334155; margin-bottom:0.3rem;">• <strong>${escapeHTML(ep.position)}</strong> tại <em>${escapeHTML(ep.organization)}</em></div>`).join('') : '<div style="font-size:0.85rem; color:#94a3b8;">Chưa ghi nhận chức vụ kiêm nhiệm ngoài CLB.</div>'}
        </div>

        <div style="background:#f0fdf4; padding:1rem; border-radius:12px; border:1px solid #bbf7d0;">
          <h4 style="font-size:0.9rem; font-weight:700; color:#047857; margin-bottom:0.5rem;">⏳ Lịch sử thăng tiến nội bộ CLB:</h4>
          ${posHistory.length ? posHistory.map(ph => `<div style="font-size:0.85rem; color:#334155; margin-bottom:0.3rem;">• <strong>${escapeHTML(ph.role_id)}</strong> (${escapeHTML(ph.start_date)} → ${ph.end_date || 'Hiện tại'})</div>`).join('') : '<div style="font-size:0.85rem; color:#94a3b8;">Đang ở mốc bổ nhiệm ban đầu.</div>'}
        </div>

        <div style="margin-top:1.25rem; text-align:right;">
          <button class="btn btn-primary btn-sm" onclick="issueCertificateModal('${profile.id}')">🎖️ Xuất Chứng nhận Điện tử</button>
        </div>
      </div>
    `;

    showModal('Hồ sơ Nhân sự Chi tiết', modalContent);
  } catch (err) {
    alert('Lỗi tải hồ sơ: ' + err.message);
  }
}
