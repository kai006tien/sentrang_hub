/**
 * Sen Trắng Hub v2 — Events Module (ĐRL → ĐTT)
 */

function renderEventsUI(events, allMembers) {
  const container = document.getElementById('events-container');
  const actionsEl = document.getElementById('events-action-buttons');
  if (!container) return;

  const safeEscape = typeof escapeHTML === 'function' ? escapeHTML : (s => s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : '');
  const checkSuperAdmin = typeof isSuperAdmin === 'function' ? isSuperAdmin : (() => true);
  const checkPerm = typeof hasPermission === 'function' ? hasPermission : (() => true);
  const formatDate = typeof safeFormatDate === 'function' ? safeFormatDate : ((d, fb = 'Mới đây') => {
    if (!d) return fb;
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString('vi-VN');
    } catch { return String(d) || fb; }
  });

  try {
    if (actionsEl) {
      let btns = (checkPerm('events.create') || checkSuperAdmin()) ? `<button class="btn btn-primary btn-sm" onclick="openCreateEventModal()">+ Tạo sự kiện</button>` : '';
      if (checkSuperAdmin()) {
        btns += ` <button class="btn btn-danger btn-sm" onclick="openResetModuleModal('events')">🔄 Reset Sự kiện</button>`;
      }
      actionsEl.innerHTML = btns;
    }

    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const canCheckIn = (
      checkSuperAdmin() ||
      checkPerm('attendance.manage') ||
      checkPerm('events.create') ||
      (user && (user.role_id === 'role_super_admin' || user.role_name === 'Super Admin' || (user.role_level !== undefined && parseInt(user.role_level) <= 3)))
    );

    const safeEvents = Array.isArray(events) ? events.filter(e => e && typeof e === 'object') : (events && Array.isArray(events.data) ? events.data.filter(e => e && typeof e === 'object') : []);
    const safeMembers = Array.isArray(allMembers) ? allMembers.filter(m => m && typeof m === 'object') : (allMembers && Array.isArray(allMembers.data) ? allMembers.data.filter(m => m && typeof m === 'object') : []);

    const userMem = safeMembers.find(m => m && (m.user_id === user?.id || m.email === user?.email));
    const catColors = { volunteer:{bg:'#FFEBEE',text:'#C62828',label:'Tình nguyện'}, training:{bg:'#E3F2FD',text:'#0D47A1',label:'Đào tạo'}, social:{bg:'#E8F5E9',text:'#1B5E20',label:'Sinh hoạt'}, meeting:{bg:'#FFF3E0',text:'#E65100',label:'Họp BCN'} };

    // Helper for safe inline JS parameter
    const attrEscape = (str) => safeEscape(str).replace(/'/g, "\\'");

    // Archive Filter Bar HTML
    const filterBarHTML = `
      <div class="archive-filter-bar" style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-xl);padding:0.85rem 1.15rem;margin-bottom:1.25rem;box-shadow:var(--shadow-sm);display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;justify-content:space-between;">
        <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;flex:1;">
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span style="font-size:0.825rem;font-weight:700;color:var(--primary-700);white-space:nowrap;">📁 Lưu trữ Tháng/Năm:</span>
            <select id="event-filter-month" onchange="filterEventsByArchive()" style="padding:0.4rem 0.65rem;border-radius:var(--radius-md);border:1px solid var(--border-light);font-size:0.825rem;font-weight:600;background:var(--bg-main);">
              <option value="all">🌐 Tất cả thời gian</option>
              <option value="2026-07">📅 Tháng 07 / 2026</option>
              <option value="2026-08">📅 Tháng 08 / 2026</option>
              <option value="2026-09">📅 Tháng 09 / 2026</option>
              <option value="archive">📦 Kho Lưu trữ Sự kiện Cũ</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span style="font-size:0.825rem;font-weight:700;color:var(--primary-700);white-space:nowrap;">📌 Trạng thái:</span>
            <select id="event-filter-status" onchange="filterEventsByArchive()" style="padding:0.4rem 0.65rem;border-radius:var(--radius-md);border:1px solid var(--border-light);font-size:0.825rem;font-weight:600;background:var(--bg-main);">
              <option value="all">Tất cả trạng thái</option>
              <option value="active">🟢 Đang diễn ra</option>
              <option value="archived">📦 Đã lưu trữ / Đóng</option>
            </select>
          </div>
        </div>
        <div style="min-width:200px;">
          <input type="text" id="event-search-input" placeholder="🔍 Tìm kiếm sự kiện..." oninput="filterEventsByArchive()" style="width:100%;padding:0.4rem 0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-light);font-size:0.825rem;">
        </div>
      </div>
    `;
    
    // 1. Render Event Cards
    const cardsHTML = (safeEvents.length === 0)
      ? `
        <div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;background:var(--bg-card);border:2px dashed var(--border-light);border-radius:var(--radius-xl);">
          <div style="font-size:3.5rem;margin-bottom:0.5rem;">📅</div>
          <h4 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:0.35rem;">Không tìm thấy sự kiện phù hợp</h4>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1.25rem;">Thử thay đổi bộ lọc Tháng/Năm hoặc tạo sự kiện mới bên dưới.</p>
          <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
            ${(checkPerm('events.create') || checkSuperAdmin()) ? `<button class="btn btn-primary btn-sm" onclick="openCreateEventModal()">+ Tạo sự kiện mới</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="if(typeof ensureSeedData==='function'){ensureSeedData();}loadEventsList();showToast('Đã nạp dữ liệu sự kiện mẫu!','success');">🔄 Nạp dữ liệu sự kiện mẫu</button>
          </div>
        </div>
      ` 
      : safeEvents.map(e => {
          const cat = catColors[e.category] || catColors.volunteer;
          const currentCount = parseInt(e.current_count) || 0;
          const maxCapacity = parseInt(e.max_participants) || 50;
          const pct = Math.min(100, Math.round((currentCount / maxCapacity) * 100));
          const title = safeEscape(e.title || 'Sự kiện');
          const titleAttr = attrEscape(e.title || 'Sự kiện');
          const eventId = attrEscape(e.id || '');

          return `<div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-xl);padding:1.25rem;box-shadow:var(--shadow-sm);transition:all 0.25s ease;" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='none'">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.6rem;">
              <span style="font-size:0.72rem;padding:0.2rem 0.65rem;background:${cat.bg};color:${cat.text};font-weight:700;border-radius:var(--radius-full);white-space:nowrap;display:inline-block;">${cat.label}</span>
              <span style="font-size:0.72rem;color:var(--text-muted);white-space:nowrap;">${formatDate(e.start_date, 'Mới đây')}</span>
            </div>
            <h4 style="font-size:1rem;font-weight:700;margin-bottom:0.35rem;">${title}</h4>
            <p style="font-size:0.825rem;color:var(--text-muted);margin-bottom:0.75rem;">📍 ${safeEscape(e.location || 'CLB')}</p>
            <div style="background:var(--bg-main);border-radius:var(--radius-full);height:6px;margin-bottom:0.75rem;overflow:hidden;"><div style="background:var(--primary-gradient-light);height:100%;width:${pct}%;border-radius:var(--radius-full);"></div></div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.8rem;color:var(--accent-green);font-weight:700;">👥 ${currentCount}/${maxCapacity}</span>
              ${canCheckIn 
                ? `<button class="btn btn-secondary btn-sm" onclick="openQrCheckInModal('${eventId}','${titleAttr}')">📷 Điểm danh</button>`
                : `<button class="btn btn-secondary btn-sm" onclick="openEventAttendeesModal('${eventId}','${titleAttr}')">📋 Xem danh sách</button>`
              }
            </div>
          </div>`;
        }).join('');

    // 2. Render Activity Attendance Statistics Table
    const tableRowsHTML = (safeEvents.length === 0)
      ? `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">Chưa có dữ liệu thống kê sự kiện nào.</td></tr>`
      : safeEvents.map(e => {
          const cat = catColors[e.category] || catColors.volunteer;
          const dateStr = formatDate(e.start_date, 'N/A');
          const title = safeEscape(e.title || 'Sự kiện');
          const titleAttr = attrEscape(e.title || 'Sự kiện');
          const eventId = attrEscape(e.id || '');

          const attendedMembers = safeMembers.filter(m => {
            if (!m || !Array.isArray(m.points_history)) return false;
            return m.points_history.some(ph => {
              if (!ph) return false;
              if (ph.event_id && e.id && String(ph.event_id) === String(e.id)) return true;
              const phTitle = String(ph.title || '');
              const eTitle = String(e.title || '');
              return Boolean(eTitle && phTitle.includes(eTitle));
            });
          });

          const history = (userMem && Array.isArray(userMem.points_history)) ? userMem.points_history : [];
          const isAttended = history.some(ph => {
            if (!ph) return false;
            if (ph.event_id && e.id && String(ph.event_id) === String(e.id)) return true;
            const phTitle = String(ph.title || '');
            const eTitle = String(e.title || '');
            return Boolean(eTitle && phTitle.includes(eTitle));
          });
          const totalCount = Math.max(parseInt(e.current_count) || 0, attendedMembers.length);
          const maxCap = parseInt(e.max_participants) || 50;

          if (canCheckIn) {
            return `
              <tr>
                <td><strong>${title}</strong></td>
                <td><span style="font-size:0.72rem;padding:0.2rem 0.65rem;background:${cat.bg};color:${cat.text};font-weight:700;border-radius:var(--radius-full);white-space:nowrap;display:inline-block;">${cat.label}</span></td>
                <td><span style="font-size:0.825rem;color:var(--text-muted);white-space:nowrap;">${dateStr}</span></td>
                <td><span style="font-size:0.825rem;color:var(--text-muted);">📍 ${safeEscape(e.location || 'CLB')}</span></td>
                <td><span style="font-weight:700;color:var(--accent-green);white-space:nowrap;">👥 ${totalCount} / ${maxCap}</span></td>
                <td style="white-space:nowrap;">
                  <button class="btn btn-secondary btn-sm" onclick="openEventAttendeesModal('${eventId}','${titleAttr}')">
                    📋 Xem danh sách đã điểm danh (${totalCount})
                  </button>
                </td>
              </tr>
            `;
          } else {
            return `
              <tr>
                <td><strong>${title}</strong></td>
                <td><span style="font-size:0.72rem;padding:0.2rem 0.65rem;background:${cat.bg};color:${cat.text};font-weight:700;border-radius:var(--radius-full);white-space:nowrap;display:inline-block;">${cat.label}</span></td>
                <td><span style="font-size:0.825rem;color:var(--text-muted);white-space:nowrap;">${dateStr}</span></td>
                <td><span style="font-size:0.825rem;color:var(--text-muted);">📍 ${safeEscape(e.location || 'CLB')}</span></td>
                <td><span style="font-weight:700;color:var(--accent-green);white-space:nowrap;">👥 ${totalCount} / ${maxCap}</span></td>
                <td style="white-space:nowrap;">
                  <div style="display:flex;align-items:center;gap:0.5rem;">
                    ${isAttended 
                      ? '<span style="color:#2E7D32;font-weight:700;background:#E8F5E9;padding:0.25rem 0.65rem;border-radius:var(--radius-full);font-size:0.775rem;white-space:nowrap;display:inline-block;">✅ Đã tham gia (+10 ĐTT)</span>'
                      : '<span style="color:#C62828;font-weight:600;background:#FFEBEE;padding:0.25rem 0.65rem;border-radius:var(--radius-full);font-size:0.775rem;white-space:nowrap;display:inline-block;">⏳ Chưa điểm danh</span>'
                    }
                    <button class="btn btn-secondary btn-sm" style="font-size:0.72rem;padding:0.2rem 0.5rem;" onclick="openEventAttendeesModal('${eventId}','${titleAttr}')">📋 Xem sĩ số</button>
                  </div>
                </td>
              </tr>
            `;
          }
    }).join('');

    const statsTableHTML = `
      <div style="margin-top:1.5rem;background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-xl);padding:1.25rem;box-shadow:var(--shadow-sm);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
          <div>
            <h3 style="font-size:1.05rem;font-weight:800;color:var(--primary-700);margin:0;">📊 Bảng Thống Kê Điểm Danh Hoạt Động</h3>
            <div style="font-size:0.8rem;color:var(--text-muted);">Theo dõi chi tiết số lượt tham gia và danh sách thành viên đã điểm danh</div>
          </div>
          <span style="font-size:0.75rem;padding:0.25rem 0.65rem;background:var(--bg-main);border:1px solid var(--border-light);border-radius:var(--radius-full);font-weight:700;color:var(--primary-600);">
            👤 ${safeEscape(user?.display_name || 'Thành viên')}
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
                <th>${canCheckIn ? 'Danh sách điểm danh (Admin & Quyền quản lý)' : 'Trạng thái của bạn'}</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const cardsContainerWrapper = (safeEvents.length === 0)
      ? cardsHTML
      : `<div class="events-list" style="margin-bottom:1.5rem;">${cardsHTML}</div>`;

    container.innerHTML = filterBarHTML + cardsContainerWrapper + statsTableHTML;
  } catch (err) {
    console.error('[renderEventsUI Error]', err);
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:2.5rem 1rem;background:var(--bg-card);border:1px solid #FFCDD2;border-radius:var(--radius-xl);">
        <div style="font-size:3rem;margin-bottom:0.5rem;">⚠️</div>
        <h4 style="font-size:1.1rem;font-weight:800;color:#C62828;margin-bottom:0.35rem;">Không thể nạp danh sách sự kiện</h4>
        <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem;">Đã xảy ra sự cố khi xử lý dữ liệu: ${safeEscape(err.message)}</p>
        <button class="btn btn-primary btn-sm" onclick="if(typeof ensureSeedData==='function'){ensureSeedData();}loadEventsList();">🔄 Khôi phục & Thử lại</button>
      </div>
    `;
  }
}

async function loadEventsList() {
  if (typeof ensureSeedData === 'function') ensureSeedData();

  const fallbackEvts = [
    { id: 'event_01', title: 'Chiến dịch Mùa Hè Tình Nguyện 2026', category: 'volunteer', location: 'Huyện Hóc Môn, TP.HCM', start_date: '2026-07-20T08:00:00Z', max_participants: 50, current_count: 12, points_reward: 10, status: 'active' },
    { id: 'event_02', title: 'Tập huấn Kỹ năng Đội Nhóm & Sơ cứu', category: 'training', location: 'Hội trường B - Bách Khoa', start_date: '2026-07-25T14:00:00Z', max_participants: 40, current_count: 8, points_reward: 10, status: 'active' },
    { id: 'event_03', title: 'Sinh hoạt Định kỳ CLB Tháng 7', category: 'social', location: 'Phòng Sinh hoạt Sen Trắng', start_date: '2026-07-30T18:00:00Z', max_participants: 60, current_count: 15, points_reward: 10, status: 'active' }
  ];
  
  let initialEvents = (typeof MOCK_DB !== 'undefined' && Array.isArray(MOCK_DB.events) && MOCK_DB.events.length > 0) ? MOCK_DB.events : fallbackEvts;
  let initialMembers = (typeof MOCK_DB !== 'undefined' && Array.isArray(MOCK_DB.members)) ? MOCK_DB.members : [];

  // Step 1: Render INSTANTLY synchronously (0ms)
  renderEventsUI(initialEvents, initialMembers);

  // Step 2: Background refresh if network has fresh updates
  try {
    const res = await apiFetch('/api/events');
    let events = Array.isArray(res) && res.length > 0 ? res : ((res && Array.isArray(res.data) && res.data.length > 0) ? res.data : initialEvents);
    if (!Array.isArray(events) || events.length === 0) events = initialEvents;
    
    let allMembers = initialMembers;
    try {
      const memRes = await apiFetch('/api/members');
      if (Array.isArray(memRes) && memRes.length > 0) {
        allMembers = memRes;
      } else if (memRes && Array.isArray(memRes.data) && memRes.data.length > 0) {
        allMembers = memRes.data;
      }
    } catch {}

    renderEventsUI(events, allMembers);
  } catch (err) {
    console.warn('[Events Load Warning]', err);
  }
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
    if (typeof performSyncCheck === 'function') performSyncCheck();
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

// === ATTENDEES LIST MODAL FOR ADMIN & MANAGERS ===
async function openEventAttendeesModal(eventId, eventTitle) {
  try {
    const eventsRes = await apiFetch('/api/events');
    const events = Array.isArray(eventsRes) ? eventsRes : (eventsRes.data || []);
    const evt = events.find(e => e.id === eventId);
    
    const membersRes = await apiFetch('/api/members');
    const allMembers = Array.isArray(membersRes) ? membersRes : (membersRes.data || []);

    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const canManage = (
      isSuperAdmin() ||
      hasPermission('attendance.manage') ||
      hasPermission('events.create') ||
      (user && (user.role_id === 'role_super_admin' || user.role_name === 'Super Admin' || (user.role_level !== undefined && parseInt(user.role_level) <= 3)))
    );

    const safeAllMembers = Array.isArray(allMembers) ? allMembers.filter(m => m && typeof m === 'object') : [];
    const attendedMembers = safeAllMembers.filter(m => {
      if (!m || !Array.isArray(m.points_history)) return false;
      return m.points_history.some(ph => {
        if (!ph) return false;
        if (ph.event_id && eventId && String(ph.event_id) === String(eventId)) return true;
        const phTitle = String(ph.title || '');
        const eTitle = String(eventTitle || '');
        return Boolean(eTitle && phTitle.includes(eTitle));
      });
    });

    const totalCount = Math.max(evt ? (evt.current_count || 0) : 0, attendedMembers.length);
    const maxCapacity = evt ? (evt.max_participants || 50) : 50;
    const pointsReward = evt ? (evt.points_reward || 10) : 10;

    const rowsHTML = attendedMembers.map((m, idx) => `
      <tr class="attendee-row" data-name="${escapeHTML((m.full_name||'').toLowerCase())}" data-mstn="${escapeHTML((m.student_id||'').toLowerCase())}" data-dept="${escapeHTML((m.department||'').toLowerCase())}">
        <td style="font-weight:700;color:var(--text-muted);">${idx + 1}</td>
        <td>
          <div style="font-weight:700;color:var(--text-primary);">${escapeHTML(m.full_name)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHTML(m.email)}</div>
        </td>
        <td><span style="font-weight:700;color:var(--primary-700);">${escapeHTML(m.student_id || 'MSTN' + (10000+idx))}</span></td>
        <td>${escapeHTML(m.department || 'Ban Hoạt động')}</td>
        <td><span class="badge-role">${escapeHTML(m.current_position || 'Thành viên')}</span></td>
        <td><span style="color:#2E7D32;font-weight:700;background:#E8F5E9;padding:0.2rem 0.5rem;border-radius:var(--radius-full);font-size:0.75rem;">+${pointsReward} ĐTT</span></td>
        ${canManage ? `
          <td>
            <button class="btn btn-danger btn-sm" onclick="removeEventAttendance('${eventId}', '${m.id}', '${escapeHTML(m.full_name)}')">
              🗑️ Hủy điểm danh
            </button>
          </td>
        ` : ''}
      </tr>
    `).join('');

    const emptyHTML = `
      <tr>
        <td colspan="${canManage ? 7 : 6}" style="text-align:center;padding:2rem;color:var(--text-muted);">
          Chưa có thành viên nào điểm danh cho hoạt động này.
        </td>
      </tr>
    `;

    showModal(`📊 Bản Theo Dõi Danh Sách Điểm Danh — ${escapeHTML(eventTitle)}`, `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-main);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:1rem;margin-bottom:1rem;flex-wrap:wrap;gap:0.75rem;">
          <div>
            <div style="font-size:0.8rem;color:var(--text-muted);">Hoạt động:</div>
            <div style="font-size:1.05rem;font-weight:800;color:var(--primary-700);">${escapeHTML(eventTitle)}</div>
          </div>
          <div style="display:flex;gap:1rem;align-items:center;">
            <div style="text-align:center;">
              <div style="font-size:1.3rem;font-weight:800;color:var(--accent-green);">👥 ${totalCount} / ${maxCapacity}</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">Sĩ số đã tham gia</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:1.3rem;font-weight:800;color:#E65100;">+${pointsReward * totalCount} ĐTT</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">Tổng điểm cấp ra</div>
            </div>
            ${canManage ? `
              <button class="btn btn-primary btn-sm" onclick="openQrCheckInModal('${eventId}', '${escapeHTML(eventTitle)}')">
                ➕ Điểm danh thêm
              </button>
            ` : ''}
          </div>
        </div>

        <div style="margin-bottom:0.75rem;">
          <input type="text" id="attendees-search-input" placeholder="🔍 Tìm kiếm thành viên theo Tên, MSTN hoặc Ban hoạt động..." oninput="filterAttendeesModalTable()" style="width:100%;padding:0.6rem;border-radius:var(--radius-md);border:1px solid var(--border-light);">
        </div>

        <div class="table-responsive" style="max-height:360px;overflow-y:auto;">
          <table class="data-table" id="attendees-modal-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Họ và Tên & Email</th>
                <th>MSTN</th>
                <th>Ban hoạt động</th>
                <th>Chức danh</th>
                <th>Điểm (+ĐTT)</th>
                ${canManage ? <th>Hành động (Admin)</th> : ''}
              </tr>
            </thead>
            <tbody>
              ${attendedMembers.length > 0 ? rowsHTML : emptyHTML}
            </tbody>
          </table>
        </div>
      </div>
    `);
  } catch (err) {
    showToast('Lỗi tải danh sách điểm danh: ' + err.message, 'error');
  }
}

function filterAttendeesModalTable() {
  const query = (document.getElementById('attendees-search-input')?.value || '').toLowerCase().trim();
  const rows = document.querySelectorAll('#attendees-modal-table .attendee-row');
  rows.forEach(row => {
    const name = row.getAttribute('data-name') || '';
    const mstn = row.getAttribute('data-mstn') || '';
    const dept = row.getAttribute('data-dept') || '';
    if (name.includes(query) || mstn.includes(query) || dept.includes(query)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

async function removeEventAttendance(eventId, memberId, memberName) {
  if (!confirm(`Bạn có chắc chắn muốn hủy điểm danh cho thành viên "${memberName}" trong sự kiện này?`)) return;
  try {
    const res = await API.post(`/events/${eventId}/cancel-attendance`, { member_id: memberId });
    showToast(res.message || `Đã hủy điểm danh cho ${memberName}!`, 'success');
    closeModal();
    loadEventsList();
    if (typeof performSyncCheck === 'function') performSyncCheck();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

function filterEventsByArchive() {
  const monthVal = document.getElementById('event-filter-month')?.value || 'all';
  const statusVal = document.getElementById('event-filter-status')?.value || 'all';
  const searchVal = (document.getElementById('event-search-input')?.value || '').toLowerCase().trim();

  let events = (typeof MOCK_DB !== 'undefined' && Array.isArray(MOCK_DB.events)) ? MOCK_DB.events : [];
  let members = (typeof MOCK_DB !== 'undefined' && Array.isArray(MOCK_DB.members)) ? MOCK_DB.members : [];

  let filtered = events.filter(e => {
    if (!e || typeof e !== 'object') return false;
    
    // Filter by Month / Year
    if (monthVal !== 'all') {
      if (monthVal === 'archive') {
        if (e.status !== 'archived' && e.status !== 'finished') return false;
      } else {
        const dateStr = e.start_date ? new Date(e.start_date).toISOString().slice(0, 7) : '';
        if (dateStr !== monthVal) return false;
      }
    }

    // Filter by Status
    if (statusVal !== 'all') {
      if (statusVal === 'active' && e.status === 'archived') return false;
      if (statusVal === 'archived' && e.status !== 'archived' && e.status !== 'finished') return false;
    }

    // Search query
    if (searchVal) {
      const title = (e.title || '').toLowerCase();
      const loc = (e.location || '').toLowerCase();
      if (!title.includes(searchVal) && !loc.includes(searchVal)) return false;
    }

    return true;
  });

  renderEventsUI(filtered, members);
}

window.loadEventsList = loadEventsList;
window.filterEventsByArchive = filterEventsByArchive;
window.openCreateEventModal = openCreateEventModal;
window.handleCreateEventSubmit = handleCreateEventSubmit;
window.openQrCheckInModal = openQrCheckInModal;
window.executeManualCheckIn = executeManualCheckIn;
window.openEventAttendeesModal = openEventAttendeesModal;
window.filterAttendeesModalTable = filterAttendeesModalTable;
window.removeEventAttendance = removeEventAttendance;
