/**
 * Sen Trắng Hub v2 — Events Module (ĐRL → ĐTT)
 */

async function loadEventsList() {
  const container = document.getElementById('events-container');
  const actionsEl = document.getElementById('events-action-buttons');
  if (!container) return;

  if (actionsEl) {
    actionsEl.innerHTML = (hasPermission('events.create') || isSuperAdmin()) ? `<button class="btn btn-primary btn-sm" onclick="openCreateEventModal()">+ Tạo sự kiện</button>` : '';
  }
  container.innerHTML = '<div class="text-center">Đang tải...</div>';
  try {
    const res = await apiFetch('/api/events');
    const events = Array.isArray(res) ? res : (res.data || []);
    if (events.length === 0) { container.innerHTML = '<div class="text-center">Chưa có sự kiện.</div>'; return; }

    const catColors = { volunteer:{bg:'#FFEBEE',text:'#C62828',label:'Tình nguyện'}, training:{bg:'#E3F2FD',text:'#0D47A1',label:'Đào tạo'}, social:{bg:'#E8F5E9',text:'#1B5E20',label:'Sinh hoạt'}, meeting:{bg:'#FFF3E0',text:'#E65100',label:'Họp BCN'} };
    container.innerHTML = events.map(e => {
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
          <button class="btn btn-secondary btn-sm" onclick="openQrCheckInModal('${e.id}','${escapeHTML(e.title)}')">📷 Điểm danh</button>
        </div>
      </div>`;
    }).join('');
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

  showModal(`📷 Điểm Danh Sự Kiện: ${escapeHTML(eventTitle)}`, `
    <div style="margin-bottom:1rem;">
      <div style="display:flex;gap:0.5rem;margin-bottom:1rem;border-bottom:1px solid var(--border-light);padding-bottom:0.5rem;">
        <button id="tab-btn-qr" class="btn btn-primary btn-sm" onclick="switchCheckInTab('qr')">📷 QR / Mã MSTN</button>
        <button id="tab-btn-manual" class="btn btn-secondary btn-sm" onclick="switchCheckInTab('manual')">📋 Chọn Danh Sách Thủ Công</button>
      </div>

      <!-- Tab 1: QR / MSTN -->
      <div id="checkin-tab-qr">
        <div style="text-align:center;padding:0.5rem;">
          <div style="width:140px;height:140px;margin:0 auto 1rem;background:var(--bg-main);border:2px dashed var(--primary-300);border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:0.35rem;">
            <span style="font-size:2.5rem;">📱</span>
            <span style="font-size:0.725rem;color:var(--text-muted);">Quét Camera QR</span>
          </div>
          <div style="margin-bottom:1rem;text-align:left;">
            <label style="font-size:0.8rem;font-weight:700;">Nhập MSTN - MÃ SỐ THANH NIÊN / Email:</label>
            <input type="text" id="checkin-member-id" placeholder="VD: MSTN12345 hoặc email..." style="margin-top:0.35rem;">
          </div>
          <button class="btn btn-primary btn-block" onclick="executeCheckIn('${eventId}')">✅ Xác Nhận Check-in (+10 ĐTT)</button>
        </div>
      </div>

      <!-- Tab 2: Manual Select -->
      <div id="checkin-tab-manual" style="display:none;">
        <div style="padding:0.5rem 0;">
          <div style="margin-bottom:1rem;">
            <label style="font-size:0.8rem;font-weight:700;display:block;margin-bottom:0.35rem;">Chọn thành viên điểm danh thủ công *</label>
            <select id="checkin-manual-member-select" style="width:100%;padding:0.65rem;border-radius:var(--radius-md);border:1px solid var(--border-light);">
              <option value="">-- Chọn thành viên từ danh sách CLB --</option>
              ${memberOptions}
            </select>
          </div>
          <button class="btn btn-primary btn-block" onclick="executeManualCheckIn('${eventId}')">✅ Xác Nhận Điểm Danh Thủ Công (+10 ĐTT)</button>
        </div>
      </div>
    </div>
  `);
}

function switchCheckInTab(tab) {
  const qrTab = document.getElementById('checkin-tab-qr');
  const manualTab = document.getElementById('checkin-tab-manual');
  const qrBtn = document.getElementById('tab-btn-qr');
  const manualBtn = document.getElementById('tab-btn-manual');

  if (tab === 'manual') {
    qrTab.style.display = 'none';
    manualTab.style.display = 'block';
    qrBtn.className = 'btn btn-secondary btn-sm';
    manualBtn.className = 'btn btn-primary btn-sm';
  } else {
    qrTab.style.display = 'block';
    manualTab.style.display = 'none';
    qrBtn.className = 'btn btn-primary btn-sm';
    manualBtn.className = 'btn btn-secondary btn-sm';
  }
}

async function executeCheckIn(eventId) {
  const memberId = document.getElementById('checkin-member-id')?.value.trim();
  if (!memberId) { showToast('Nhập MSTN hoặc ID!', 'warning'); return; }
  try {
    const res = await API.post(`/events/${eventId}/attendance`, { member_id: memberId, check_in_method: 'qr_code' });
    showToast(res.message || 'Check-in thành công!', 'success');
    closeModal(); loadEventsList();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

async function executeManualCheckIn(eventId) {
  const select = document.getElementById('checkin-manual-member-select');
  const memberId = select?.value;
  if (!memberId) { showToast('Vui lòng chọn thành viên cần điểm danh!', 'warning'); return; }
  try {
    const res = await API.post(`/events/${eventId}/attendance`, { member_id: memberId, check_in_method: 'manual' });
    showToast(res.message || 'Điểm danh thủ công thành công!', 'success');
    closeModal();
    loadEventsList();
    if (typeof loadOverviewStats === 'function') loadOverviewStats();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

window.loadEventsList = loadEventsList;
window.openCreateEventModal = openCreateEventModal;
window.handleCreateEventSubmit = handleCreateEventSubmit;
window.openQrCheckInModal = openQrCheckInModal;
window.switchCheckInTab = switchCheckInTab;
window.executeCheckIn = executeCheckIn;
window.executeManualCheckIn = executeManualCheckIn;
