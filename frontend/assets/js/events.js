/**
 * Sen Trắng Hub v2 — Events Module (ĐRL → ĐTT)
 */

async function loadEventsList() {
  const container = document.getElementById('events-container');
  const actionsEl = document.getElementById('events-action-buttons');
  if (!container) return;

  if (actionsEl) {
    let btns = (hasPermission('events.create') || isSuperAdmin()) ? `<button class="btn btn-primary btn-sm" onclick="openCreateEventModal()">+ Tạo sự kiện</button>` : '';
    if (isSuperAdmin()) {
      btns += ` <button class="btn btn-danger btn-sm" onclick="openResetModuleModal('events')">🔄 Reset Sự kiện</button>`;
    }
    actionsEl.innerHTML = btns;
  }
  container.innerHTML = '<div class="text-center">Đang tải...</div>';
  try {
    const res = await apiFetch('/api/events');
    const events = Array.isArray(res) ? res : (res.data || []);
    if (events.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3.5rem 1rem;background:var(--bg-card);border:2px dashed var(--border-light);border-radius:var(--radius-xl);">
          <div style="font-size:3.5rem;margin-bottom:0.5rem;">📅</div>
          <h4 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:0.35rem;">Danh sách Sự kiện đang trống</h4>
          <p style="font-size:0.85rem;color:var(--text-muted);">Hệ thống chưa có sự kiện nào. Hãy bấm nút "+ Tạo sự kiện" bên trên để bắt đầu tạo mới.</p>
        </div>
      `;
      return;
    }

    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const canCheckIn = isSuperAdmin() || hasPermission('attendance.manage') || hasPermission('events.create');

    let userMem = null;
    try {
      const memRes = await apiFetch('/api/members');
      const members = Array.isArray(memRes) ? memRes : (memRes.data || []);
      userMem = members.find(m => m.user_id === user?.id || m.email === user?.email);
    } catch {}

    const catColors = { volunteer:{bg:'#FFEBEE',text:'#C62828',label:'Tình nguyện'}, training:{bg:'#E3F2FD',text:'#0D47A1',label:'Đào tạo'}, social:{bg:'#E8F5E9',text:'#1B5E20',label:'Sinh hoạt'}, meeting:{bg:'#FFF3E0',text:'#E65100',label:'Họp BCN'} };
    
    // 1. Render Event Cards (Check-in button ONLY visible to Admin / authorized users)
    const cardsHTML = events.map(e => {
      const cat = catColors[e.category] || catColors.volunteer;
      const pct = Math.round(((e.current_count||0)/(e.max_participants||50))*100);
      return `<div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-xl);padding:1.25rem;box-shadow:var(--shadow-sm);transition:all 0.25s ease;" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='none'">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.6rem;">
          <span style="font-size:0.72rem;padding:0.2rem 0.6rem;background:${cat.bg};color:${cat.text};font-weight:700;border-radius:var(--radius-full);">${cat.label}</span>
          <span style="font-size:0.72rem;color:var(--text-muted);">${new Date(e.start_date||Date.now()).toLocaleDateString('vi-VN')}</span>
        </div>
        <h4 style="font-size:1rem;font-weight:700;margin-bottom:0.35rem;">${escapeHTML(e.title)}</h4>
        <p style="font-size:0.825rem;color:var(--text-muted);margin-bottom:0.75rem;">📍 ${escapeHTML(e.location||'CLB')}</p>
        <div style="background:var(--bg-main);border-radius:var(--radius-full);height:6px;margin-bottom:0.75rem;overflow:hidden;"><div style="background:var(--primary-gradient-light);height:100%;width:${pct}%;border-radius:var(--radius-full);"></div></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.8rem;color:var(--accent-green);font-weight:700;">👥 ${e.current_count||0}/${e.max_participants||50}</span>
          ${canCheckIn 
            ? `<button class="btn btn-secondary btn-sm" onclick="openQrCheckInModal('${e.id}','${escapeHTML(e.title)}')">📷 Điểm danh</button>`
            : `<span style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">📊 Thống kê bên dưới</span>`
          }
        </div>
      </div>`;
    }).join('');

    // 2. Render Activity Attendance Statistics Table
    const tableRowsHTML = events.map(e => {
      const cat = catColors[e.category] || catColors.volunteer;
      const history = userMem?.points_history || [];
      const isAttended = history.some(ph => ph.event_id === e.id || (ph.title || '').includes(e.title));
      const dateStr = new Date(e.start_date || Date.now()).toLocaleDateString('vi-VN');

      return `
        <tr>
          <td><strong>${escapeHTML(e.title)}</strong></td>
          <td><span style="font-size:0.72rem;padding:0.2rem 0.6rem;background:${cat.bg};color:${cat.text};font-weight:700;border-radius:var(--radius-full);">${cat.label}</span></td>
          <td><span style="font-size:0.825rem;color:var(--text-muted);">${dateStr}</span></td>
          <td><span style="font-size:0.825rem;color:var(--text-muted);">📍 ${escapeHTML(e.location || 'CLB')}</span></td>
          <td><span style="font-weight:700;color:var(--accent-green);">👥 ${e.current_count || 0} / ${e.max_participants || 50}</span></td>
          <td>
            ${isAttended 
              ? '<span style="color:#2E7D32;font-weight:700;background:#E8F5E9;padding:0.25rem 0.65rem;border-radius:var(--radius-full);font-size:0.775rem;">✅ Đã tham gia (+10 ĐTT)</span>'
              : '<span style="color:#C62828;font-weight:600;background:#FFEBEE;padding:0.25rem 0.65rem;border-radius:var(--radius-full);font-size:0.775rem;">⏳ Chưa điểm danh</span>'
            }
          </td>
        </tr>
      `;
    }).join('');

    const statsTableHTML = `
      <div style="grid-column:1/-1;margin-top:1.5rem;background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-xl);padding:1.25rem;box-shadow:var(--shadow-sm);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
          <div>
            <h3 style="font-size:1.05rem;font-weight:800;color:var(--primary-700);margin:0;">📊 Bảng Thống Kê Điểm Danh Hoạt Động</h3>
            <div style="font-size:0.8rem;color:var(--text-muted);">Theo dõi chi tiết số lượt tham gia và điểm thành tích tích lũy theo từng sự kiện</div>
          </div>
          <span style="font-size:0.75rem;padding:0.25rem 0.65rem;background:var(--bg-main);border:1px solid var(--border-light);border-radius:var(--radius-full);font-weight:700;color:var(--primary-600);">
            👤 ${escapeHTML(user?.display_name || 'Thành viên')}
          </span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tên Sự kiện / Hoạt động</th>
                <th>Phân loại</th>
                <th>Ngày tổ chức</th>
                <th>Địa điểm</th>
                <th>Số lượt đã tham gia</th>
                <th>Trạng thái của bạn</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = cardsHTML + statsTableHTML;
  } catch (err) { container.innerHTML = `<div class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</div>`; }
}

function openCreateEventModal() {
  if (!hasPermission('events.create') && !isSuperAdmin()) {
    showToast('🔒 Bạn không có quyền tạo sự kiện mới! Vui lòng liên hệ Admin.', 'warning');
    return;
  }
  const nowStr = new Date().toISOString().slice(0, 16);
  showModal('Tạo Sự Kiện Mới', `
    <form onsubmit="handleCreateEventSubmit(event)">
      <div style="margin-bottom:0.85rem;"><label>Tên sự kiện *</label><input type="text" id="evt-title" required placeholder="Chiến dịch Mùa hè Tình nguyện 2026"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:0.85rem;">
        <div><label>Phân loại</label><select id="evt-cat"><option value="volunteer">Tình nguyện</option><option value="training">Đào tạo</option><option value="social">Sinh hoạt</option><option value="meeting">Họp BCN</option></select></div>
        <div><label>Thời gian diễn ra *</label><input type="datetime-local" id="evt-date" value="${nowStr}" required></div>
      </div>
      <div style="margin-bottom:0.85rem;"><label>Địa điểm</label><input type="text" id="evt-loc" placeholder="Hội trường CLB"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:1.25rem;">
        <div><label>Số lượng tối đa</label><input type="number" id="evt-max" value="50"></div>
        <div><label>Điểm thành tích (+ĐTT)</label><input type="number" id="evt-points" value="10"></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">🚩 Tạo Sự Kiện</button>
    </form>`);
}

async function handleCreateEventSubmit(e) {
  e.preventDefault();
  if (!hasPermission('events.create') && !isSuperAdmin()) {
    showToast('🔒 Bạn không có quyền tạo sự kiện mới!', 'error');
    return;
  }
  const dtVal = document.getElementById('evt-date')?.value;
  try {
    const res = await API.post('/events', {
      title: document.getElementById('evt-title').value,
      category: document.getElementById('evt-cat').value,
      location: document.getElementById('evt-loc').value,
      start_date: dtVal ? new Date(dtVal).toISOString() : new Date().toISOString(),
      max_participants: parseInt(document.getElementById('evt-max').value)||50,
      base_points: parseFloat(document.getElementById('evt-points').value)||10
    });
    showToast(res.message || 'Tạo sự kiện thành công!', 'success');
    closeModal(); loadEventsList();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

async function openQrCheckInModal(eventId, eventTitle) {
  let members = [];
  try {
    const res = await apiFetch('/api/members');
    members = Array.isArray(res) ? res : (res.data || []);
  } catch {}

  const memberOptions = members.map(m => `
    <option value="${m.id}">
      ${escapeHTML(m.full_name)} — ${escapeHTML(m.department || 'CLB')} (${escapeHTML(m.student_id || 'MSTN')})
    </option>
  `).join('');

  showModal(`📋 Điểm Danh Thành Viên: ${escapeHTML(eventTitle)}`, `
    <div style="padding:0.25rem 0;">
      <div style="background:var(--bg-main);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:1rem;margin-bottom:1rem;">
        <label style="font-size:0.85rem;font-weight:800;color:var(--primary-700);display:block;margin-bottom:0.45rem;">
          📋 1. Chọn thành viên từ Danh sách CLB:
        </label>
        <select id="checkin-manual-member-select" style="width:100%;padding:0.7rem;border-radius:var(--radius-md);border:1.5px solid var(--primary-400);font-weight:600;background:var(--bg-card);">
          <option value="">-- Chọn thành viên từ danh sách CLB --</option>
          ${memberOptions}
        </select>
      </div>

      <div style="text-align:center;font-weight:700;color:var(--text-muted);margin-bottom:1rem;font-size:0.75rem;">— HOẶC —</div>

      <div style="background:var(--bg-main);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:1rem;margin-bottom:1.25rem;">
        <label style="font-size:0.85rem;font-weight:800;color:var(--primary-700);display:block;margin-bottom:0.45rem;">
          🔍 2. Nhập Mã MSTN / Email / Tên thành viên:
        </label>
        <input type="text" id="checkin-member-id" placeholder="VD: MSTN12345 hoặc email..." style="width:100%;padding:0.65rem;border-radius:var(--radius-md);border:1px solid var(--border-light);">
      </div>

      <button class="btn btn-primary btn-block" style="padding:0.85rem;font-size:0.95rem;font-weight:700;" onclick="executeManualCheckIn('${eventId}')">
        ✅ XÁC NHẬN ĐIỂM DANH (+10 ĐTT)
      </button>
    </div>
  `);
}

async function executeManualCheckIn(eventId) {
  const select = document.getElementById('checkin-manual-member-select');
  const input = document.getElementById('checkin-member-id');
  const memberId = (select?.value || input?.value || '').trim();
  if (!memberId) { showToast('Vui lòng chọn hoặc nhập tên/MSTN thành viên cần điểm danh!', 'warning'); return; }
  try {
    const res = await API.post(`/events/${eventId}/attendance`, { member_id: memberId, check_in_method: 'admin_manual' });
    showToast(res.message || 'Điểm danh thành công!', 'success');
    closeModal();
    loadEventsList();
    if (typeof loadOverviewStats === 'function') loadOverviewStats();
    if (typeof performSyncCheck === 'function') performSyncCheck();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

window.loadEventsList = loadEventsList;
window.openCreateEventModal = openCreateEventModal;
window.handleCreateEventSubmit = handleCreateEventSubmit;
window.openQrCheckInModal = openQrCheckInModal;
window.executeManualCheckIn = executeManualCheckIn;
