/**
 * Sen Trắng Hub v2 — Members & HR Module
 * Features: Merged Create Member & Account, Edit Member/Account, Delete Member, View Detail
 */

async function loadMembersList() {
  const container = document.getElementById('users-table-body');
  const actionsContainer = document.getElementById('users-action-buttons');
  if (!container) return;

  // Single Merged Action Button
  if (actionsContainer) {
    let btns = '';
    if (hasPermission('users.create') || isSuperAdmin()) {
      btns += `<button class="btn btn-primary btn-sm" onclick="openCreateMemberAndAccountModal()">➕ Thêm thành viên & Cấp tài khoản</button>`;
    }
    if (isSuperAdmin()) {
      btns += ` <button class="btn btn-danger btn-sm" onclick="openResetModuleModal('members')">🔄 Reset Hồ sơ</button>`;
    }
    actionsContainer.innerHTML = btns;
  }

  container.innerHTML = `<tr><td colspan="5" class="text-center">Đang tải...</td></tr>`;
  try {
    const res = await API.get('/members');
    const members = res.data || (Array.isArray(res) ? res : []);
    if (members.length === 0) { container.innerHTML = `<tr><td colspan="5" class="text-center">Chưa có dữ liệu thành viên.</td></tr>`; return; }

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
          <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHTML(m.department||'')}</div></div>
        </div></td>
        <td style="font-size:0.85rem;">${escapeHTML(m.email)}</td>
        <td><span class="badge-role">${escapeHTML(m.current_position||'Thành viên')}</span></td>
        <td><span class="${statusClass}">${statusText}</span></td>
        <td><div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="viewMemberDetail('${m.id}')">Xem</button>
          ${canManage ? `
            <button class="btn btn-secondary btn-sm" onclick="openEditMemberModal('${m.id}')">✏️ Sửa</button>
            <button class="btn btn-danger btn-sm" onclick="deleteMember('${m.id}','${escapeHTML(m.full_name)}')">🗑️ Xóa</button>
          ` : ''}
        </div></td>
      </tr>`;
    }).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</td></tr>`;
  }
}

// === MERGED CREATE MEMBER & ACCOUNT MODAL ===
function openCreateMemberAndAccountModal() {
  showModal('➕ Thêm Thành Viên & Cấp Tài Khoản', `
    <form onsubmit="handleCreateMemberAndAccountSubmit(event)">
      <div style="background:var(--info-bg);border:1px solid rgba(33,150,243,0.2);border-radius:var(--radius-md);padding:0.75rem;margin-bottom:1rem;font-size:0.825rem;color:var(--primary-700);">
        ℹ️ Nhập thông tin hồ sơ và khởi tạo ngay tài khoản đăng nhập hệ thống cho thành viên.
      </div>
      <div style="margin-bottom:0.85rem;"><label>Họ và tên *</label><input type="text" id="mem-name" required placeholder="Nguyễn Văn A"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:0.85rem;">
        <div><label>Email đăng nhập *</label><input type="email" id="mem-email" required placeholder="thanhvien@sentranghub.vn"></div>
        <div><label>Mật khẩu đăng nhập *</label><input type="text" id="mem-pass" required value="User@2026!" placeholder="Mật khẩu"></div>
      </div>
      <div style="margin-bottom:0.85rem;">
        <label>MSTN - MÃ SỐ THANH NIÊN</label><input type="text" id="mem-student-id" placeholder="MSTN2026001">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:1.25rem;">
        <div><label>Ban hoạt động</label><select id="mem-dept">
          <option value="Ban Chủ nhiệm">Ban Chủ nhiệm</option>
          <option value="Ban Thư ký">Ban Thư ký</option>
          <option value="Ban Điều hành">Ban Điều hành</option>
          <option value="Ban Công tác Hoạt động">Ban Công tác Hoạt động</option>
        </select></div>
        <div><label>Chức danh & Vai trò *</label><select id="mem-pos">
          <option value="Chủ nhiệm">Chủ nhiệm</option>
          <option value="Phó Chủ nhiệm Thường trực">Phó Chủ nhiệm Thường trực</option>
          <option value="Phó Chủ nhiệm">Phó Chủ nhiệm</option>
          <option value="Ủy viên Ban Chủ nhiệm">Ủy viên Ban Chủ nhiệm</option>
          <option value="Thư ký">Thư ký</option>
          <option value="Thủ quỹ">Thủ quỹ</option>
          <option value="Thành viên" selected>Thành viên</option>
          <option value="Cộng tác viên">Cộng tác viên</option>
        </select></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">✨ Thêm Thành Viên & Cấp Tài Khoản</button>
    </form>`);
}

async function handleCreateMemberAndAccountSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('mem-name').value;
  const email = document.getElementById('mem-email').value;
  const password = document.getElementById('mem-pass').value;
  const studentId = document.getElementById('mem-student-id').value;
  const dept = document.getElementById('mem-dept').value;
  const pos = document.getElementById('mem-pos').value;

  try {
    // 1. Save Member profile
    const resMem = await API.post('/members', {
      full_name: fullName,
      email: email,
      student_id: studentId,
      department: dept,
      current_position: pos
    });

    // 2. Create Login Account
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
    await API.post('/users/create-account', {
      display_name: fullName,
      email: email,
      password: password,
      role_id: roleMap[pos] || 'role_thanh_vien'
    });

    showToast(`Đã thêm thành viên & cấp tài khoản thành công cho ${fullName}!`, 'success');
    closeModal();
    loadMembersList();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

// === EDIT MEMBER & ACCOUNT MODAL ===
async function openEditMemberModal(memberId) {
  try {
    const res = await API.get('/members');
    const members = res.data || (Array.isArray(res) ? res : []);
    const m = members.find(x => x.id === memberId);
    if (!m) { showToast('Không tìm thấy thông tin thành viên!', 'error'); return; }

    showModal(`✏️ Chỉnh Sửa Thành Viên: ${escapeHTML(m.full_name)}`, `
      <form onsubmit="handleEditMemberSubmit(event, '${m.id}')">
        <div style="margin-bottom:0.85rem;"><label>Họ và tên *</label><input type="text" id="edit-mem-name" required value="${escapeHTML(m.full_name)}"></div>
        <div style="margin-bottom:0.85rem;"><label>Email *</label><input type="email" id="edit-mem-email" required value="${escapeHTML(m.email)}"></div>
        <div style="margin-bottom:0.85rem;">
          <label>MSTN - MÃ SỐ THANH NIÊN</label><input type="text" id="edit-mem-student-id" value="${escapeHTML(m.student_id||'')}">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:0.85rem;">
          <div><label>Ban hoạt động</label><select id="edit-mem-dept">
            <option value="Ban Chủ nhiệm" ${m.department==='Ban Chủ nhiệm'?'selected':''}>Ban Chủ nhiệm</option>
            <option value="Ban Thư ký" ${m.department==='Ban Thư ký'?'selected':''}>Ban Thư ký</option>
            <option value="Ban Điều hành" ${m.department==='Ban Điều hành'?'selected':''}>Ban Điều hành</option>
            <option value="Ban Công tác Hoạt động" ${m.department==='Ban Công tác Hoạt động'?'selected':''}>Ban Công tác Hoạt động</option>
          </select></div>
          <div><label>Chức danh & Vai trò</label><select id="edit-mem-pos">
            <option value="Chủ nhiệm" ${m.current_position==='Chủ nhiệm'?'selected':''}>Chủ nhiệm</option>
            <option value="Phó Chủ nhiệm Thường trực" ${m.current_position==='Phó Chủ nhiệm Thường trực'?'selected':''}>Phó Chủ nhiệm Thường trực</option>
            <option value="Phó Chủ nhiệm" ${m.current_position==='Phó Chủ nhiệm'?'selected':''}>Phó Chủ nhiệm</option>
            <option value="Ủy viên Ban Chủ nhiệm" ${m.current_position==='Ủy viên Ban Chủ nhiệm'?'selected':''}>Ủy viên Ban Chủ nhiệm</option>
            <option value="Thư ký" ${m.current_position==='Thư ký'?'selected':''}>Thư ký</option>
            <option value="Thủ quỹ" ${m.current_position==='Thủ quỹ'?'selected':''}>Thủ quỹ</option>
            <option value="Thành viên" ${m.current_position==='Thành viên'?'selected':''}>Thành viên</option>
            <option value="Cộng tác viên" ${m.current_position==='Cộng tác viên'?'selected':''}>Cộng tác viên</option>
          </select></div>
        </div>
        <div style="margin-bottom:0.85rem;"><label>🔑 Đổi mật khẩu tài khoản (để trống nếu giữ nguyên)</label><input type="password" id="edit-mem-pass" placeholder="Nhập mật khẩu mới..."></div>
        <div style="margin-bottom:1.25rem;"><label>Trạng thái hoạt động</label><select id="edit-mem-status">
          <option value="active" ${m.status!=='inactive'?'selected':''}>Hoạt động</option>
          <option value="inactive" ${m.status==='inactive'?'selected':''}>Tạm nghỉ</option>
        </select></div>
        <button type="submit" class="btn btn-primary btn-block">💾 Lưu Thay Đổi</button>
      </form>
    `);
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

async function handleEditMemberSubmit(e, memberId) {
  e.preventDefault();
  try {
    const newPass = document.getElementById('edit-mem-pass')?.value;
    const payload = {
      full_name: document.getElementById('edit-mem-name').value,
      email: document.getElementById('edit-mem-email').value,
      student_id: document.getElementById('edit-mem-student-id').value,
      department: document.getElementById('edit-mem-dept').value,
      current_position: document.getElementById('edit-mem-pos').value,
      status: document.getElementById('edit-mem-status').value
    };
    if (newPass && newPass.trim() !== '') {
      payload.password = newPass.trim();
    }
    const res = await API.put(`/members/${memberId}`, payload);
    showToast(res.message || 'Cập nhật thông tin thành viên thành công!', 'success');
    closeModal();
    loadMembersList();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

// === DELETE MEMBER ===
async function deleteMember(memberId, memberName) {
  if (!confirm(`Bạn có chắc chắn muốn xóa thành viên "${memberName}" khỏi hệ thống?`)) return;
  try {
    const res = await API.delete(`/members/${memberId}`);
    showToast(res.message || `Đã xóa thành viên ${memberName} thành công!`, 'success');
    loadMembersList();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

// === MEMBER DETAIL (EDITABLE & SYNCHRONIZED) ===
async function viewMemberDetail(memberId) {
  try {
    const res = await API.get(`/members/${memberId}`);
    const data = res.data || res;
    if (!data || !data.profile) { showToast('Không tìm thấy hồ sơ thành viên!', 'error'); return; }

    const p = data.profile;
    const extList = p.external_positions || data.external_positions || [
      { position: 'Phó Bí thư Chi Đoàn', organization: 'Chi Đoàn Khoa CNTT - ĐH Bách Khoa' }
    ];
    const histList = p.position_history || data.position_history || [
      { role_id: p.current_position || 'Thành viên', start_date: '2025-01-01', end_date: 'Hiện tại' }
    ];

    const canEdit = isSuperAdmin() || hasPermission('users.update');

    showModal(`📋 Hồ sơ Chi tiết: ${escapeHTML(p.full_name)}`, `
      <form onsubmit="handleSaveDetailedMemberProfile(event, '${p.id}')">
        <div style="display:flex;align-items:center;gap:1.25rem;margin-bottom:1.25rem;background:var(--bg-main);padding:1rem;border-radius:var(--radius-lg);border:1px solid var(--border-light);">
          <div style="width:56px;height:56px;border-radius:50%;background:var(--primary-gradient);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.4rem;flex-shrink:0;">
            ${(p.full_name||'M').charAt(0).toUpperCase()}
          </div>
          <div style="flex:1;">
            <h3 style="font-size:1.15rem;font-weight:800;margin:0 0 0.2rem;color:var(--text-primary);">${escapeHTML(p.full_name)}</h3>
            <div style="font-size:0.8rem;color:var(--text-muted);">📧 ${escapeHTML(p.email)}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:1rem;">
          <div>
            <label style="font-size:0.75rem;font-weight:700;">Họ và tên *</label>
            <input type="text" id="detail-mem-name" value="${escapeHTML(p.full_name)}" ${canEdit?'':'disabled'} required>
          </div>
          <div>
            <label style="font-size:0.75rem;font-weight:700;">MSTN - MÃ SỐ THANH NIÊN</label>
            <input type="text" id="detail-mem-student-id" value="${escapeHTML(p.student_id||'')}" ${canEdit?'':'disabled'}>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:1rem;">
          <div>
            <label style="font-size:0.75rem;font-weight:700;">Ban hoạt động</label>
            <select id="detail-mem-dept" ${canEdit?'':'disabled'}>
              <option value="Ban Chủ nhiệm" ${p.department==='Ban Chủ nhiệm'?'selected':''}>Ban Chủ nhiệm</option>
              <option value="Ban Thư ký" ${p.department==='Ban Thư ký'?'selected':''}>Ban Thư ký</option>
              <option value="Ban Điều hành" ${p.department==='Ban Điều hành'?'selected':''}>Ban Điều hành</option>
              <option value="Ban Công tác Hoạt động" ${p.department==='Ban Công tác Hoạt động'?'selected':''}>Ban Công tác Hoạt động</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.75rem;font-weight:700;">Chức danh & Vai trò chính</label>
            <select id="detail-mem-pos" ${canEdit?'':'disabled'}>
              <option value="Chủ nhiệm" ${p.current_position==='Chủ nhiệm'?'selected':''}>Chủ nhiệm</option>
              <option value="Phó Chủ nhiệm Thường trực" ${p.current_position==='Phó Chủ nhiệm Thường trực'?'selected':''}>Phó Chủ nhiệm Thường trực</option>
              <option value="Phó Chủ nhiệm" ${p.current_position==='Phó Chủ nhiệm'?'selected':''}>Phó Chủ nhiệm</option>
              <option value="Ủy viên Ban Chủ nhiệm" ${p.current_position==='Ủy viên Ban Chủ nhiệm'?'selected':''}>Ủy viên Ban Chủ nhiệm</option>
              <option value="Thư ký" ${p.current_position==='Thư ký'?'selected':''}>Thư ký</option>
              <option value="Thủ quỹ" ${p.current_position==='Thủ quỹ'?'selected':''}>Thủ quỹ</option>
              <option value="Thành viên" ${p.current_position==='Thành viên'?'selected':''}>Thành viên</option>
              <option value="Cộng tác viên" ${p.current_position==='Cộng tác viên'?'selected':''}>Cộng tác viên</option>
            </select>
          </div>
        </div>

        <!-- Chức vụ kiêm nhiệm (Editable) -->
        <div style="background:var(--bg-main);padding:1rem;border-radius:var(--radius-lg);margin-bottom:1rem;border:1px solid var(--border-light);">
          <h4 style="font-size:0.875rem;font-weight:700;color:var(--primary-700);margin-bottom:0.6rem;">🏢 Chức vụ kiêm nhiệm bên ngoài</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
            <div>
              <label style="font-size:0.725rem;color:var(--text-muted);">Chức danh kiêm nhiệm</label>
              <input type="text" id="detail-mem-ext-pos" value="${escapeHTML(extList[0]?.position||'')}" placeholder="Phó Bí thư Chi Đoàn" ${canEdit?'':'disabled'}>
            </div>
            <div>
              <label style="font-size:0.725rem;color:var(--text-muted);">Tổ chức / Đơn vị kiêm nhiệm</label>
              <input type="text" id="detail-mem-ext-org" value="${escapeHTML(extList[0]?.organization||'')}" placeholder="Chi Đoàn Khoa CNTT" ${canEdit?'':'disabled'}>
            </div>
          </div>
        </div>

        <!-- Lịch sử thăng tiến (Editable) -->
        <div style="background:var(--success-bg);padding:1rem;border-radius:var(--radius-lg);margin-bottom:1.25rem;border:1px solid rgba(0,200,83,0.2);">
          <h4 style="font-size:0.875rem;font-weight:700;color:#1B5E20;margin-bottom:0.6rem;">⏳ Lịch sử thăng tiến & Nhiệm kỳ</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;">
            <div>
              <label style="font-size:0.725rem;color:var(--text-muted);">Chức danh quá trình</label>
              <input type="text" id="detail-mem-hist-role" value="${escapeHTML(histList[0]?.role_id||p.current_position||'Thành viên')}" ${canEdit?'':'disabled'}>
            </div>
            <div>
              <label style="font-size:0.725rem;color:var(--text-muted);">Ngày bắt đầu</label>
              <input type="text" id="detail-mem-hist-start" value="${escapeHTML(histList[0]?.start_date||'2025-01-01')}" ${canEdit?'':'disabled'}>
            </div>
            <div>
              <label style="font-size:0.725rem;color:var(--text-muted);">Ngày kết thúc</label>
              <input type="text" id="detail-mem-hist-end" value="${escapeHTML(histList[0]?.end_date||'Hiện tại')}" ${canEdit?'':'disabled'}>
            </div>
          </div>
        </div>

        ${canEdit ? `<button type="submit" class="btn btn-primary btn-block">💾 Lưu & Đồng Bộ Hồ Sơ Chi Tiết</button>` : ''}
      </form>
    `);
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

async function handleSaveDetailedMemberProfile(e, memberId) {
  e.preventDefault();
  try {
    const payload = {
      full_name: document.getElementById('detail-mem-name').value,
      student_id: document.getElementById('detail-mem-student-id').value,
      department: document.getElementById('detail-mem-dept').value,
      current_position: document.getElementById('detail-mem-pos').value,
      external_positions: [
        {
          position: document.getElementById('detail-mem-ext-pos').value,
          organization: document.getElementById('detail-mem-ext-org').value
        }
      ],
      position_history: [
        {
          role_id: document.getElementById('detail-mem-hist-role').value,
          start_date: document.getElementById('detail-mem-hist-start').value,
          end_date: document.getElementById('detail-mem-hist-end').value
        }
      ]
    };

    const res = await API.put(`/members/${memberId}`, payload);
    showToast(res.message || 'Đã lưu & đồng bộ hồ sơ chi tiết thành công!', 'success');
    closeModal();
    if (typeof loadMembersList === 'function') loadMembersList();
    if (typeof loadOverviewStats === 'function') loadOverviewStats();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

window.loadMembersList = loadMembersList;
window.openCreateMemberAndAccountModal = openCreateMemberAndAccountModal;
window.handleCreateMemberAndAccountSubmit = handleCreateMemberAndAccountSubmit;
window.openEditMemberModal = openEditMemberModal;
window.handleEditMemberSubmit = handleEditMemberSubmit;
window.deleteMember = deleteMember;
window.viewMemberDetail = viewMemberDetail;
window.handleSaveDetailedMemberProfile = handleSaveDetailedMemberProfile;
