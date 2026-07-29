/**
 * Sen Trắng Hub — Events & Attendance Module
 */

async function loadEventsList() {
  const container = document.getElementById('events-container');
  if (!container) return;

  container.innerHTML = '<div class="text-center">Đang tải danh sách sự kiện...</div>';

  try {
    const res = await API.get('/events');
    const events = res.data || (Array.isArray(res) ? res : []);

    if (events.length === 0) {
      container.innerHTML = '<div class="text-center">Chưa có sự kiện nào. Hãy ấn "+ Tạo sự kiện" để bắt đầu.</div>';
      return;
    }

    const categoryColors = {
      'volunteer': { bg: '#FFEBEE', text: '#C62828', label: 'Tình nguyện' },
      'training': { bg: '#E3F2FD', text: '#0D47A1', label: 'Đào tạo' },
      'social': { bg: '#E8F5E9', text: '#1B5E20', label: 'Sinh hoạt' },
      'meeting': { bg: '#FFF3E0', text: '#E65100', label: 'Họp BCN' }
    };

    container.innerHTML = events.map(e => {
      const cat = categoryColors[e.category] || categoryColors['volunteer'];
      const progress = Math.round(((e.current_count || 0) / (e.max_participants || 50)) * 100);

      return `
        <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-xl); padding:1.25rem; box-shadow:var(--shadow-sm); transition:all 0.25s ease; cursor:default;" onmouseenter="this.style.boxShadow='var(--shadow-md)'; this.style.transform='translateY(-2px)'" onmouseleave="this.style.boxShadow='var(--shadow-sm)'; this.style.transform='none'">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
            <span style="font-size:0.72rem; padding:0.2rem 0.6rem; background:${cat.bg}; color:${cat.text}; font-weight:700; border-radius:var(--radius-full);">${cat.label}</span>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:500;">${new Date(e.start_date || Date.now()).toLocaleDateString('vi-VN')}</span>
          </div>
          <h4 style="font-size:1rem; font-weight:700; color:var(--text-primary); margin-bottom:0.35rem;">${escapeHTML(e.title)}</h4>
          <p style="font-size:0.825rem; color:var(--text-muted); margin-bottom:0.75rem;">📍 ${escapeHTML(e.location || 'Tại trụ sở CLB')}</p>
          
          <div style="background:var(--bg-main); border-radius:var(--radius-full); height:6px; margin-bottom:0.75rem; overflow:hidden;">
            <div style="background:var(--primary-gradient-light); height:100%; width:${progress}%; border-radius:var(--radius-full); transition:width 0.5s ease;"></div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.8rem; color:var(--accent-green); font-weight:700;">👥 ${e.current_count || 0}/${e.max_participants || 50}</span>
            <button class="btn btn-secondary btn-sm" onclick="openQrCheckInModal('${e.id}', '${escapeHTML(e.title)}')">📷 Điểm danh</button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="text-center text-danger">Lỗi tải sự kiện: ${escapeHTML(err.message)}</div>`;
    console.error('loadEventsList error:', err);
  }
}

function openCreateEventModal() {
  const modalHTML = `
    <form id="create-event-form" onsubmit="handleCreateEventSubmit(event)">
      <div style="margin-bottom:0.85rem;">
        <label>Tên chiến dịch / sự kiện *</label>
        <input type="text" id="evt-title" required placeholder="Chiến dịch Mùa hè Tình nguyện 2026">
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; margin-bottom:0.85rem;">
        <div>
          <label>Phân loại</label>
          <select id="evt-cat">
            <option value="volunteer">Tình nguyện</option>
            <option value="training">Đào tạo tập huấn</option>
            <option value="social">Sinh hoạt tập thể</option>
            <option value="meeting">Họp định kỳ BCN</option>
          </select>
        </div>
        <div>
          <label>Địa điểm tổ chức</label>
          <input type="text" id="evt-loc" placeholder="Xã Hiệp Hòa / Hội trường CLB">
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; margin-bottom:1.25rem;">
        <div>
          <label>Số lượng tối đa</label>
          <input type="number" id="evt-max" value="50">
        </div>
        <div>
          <label>Điểm rèn luyện (+ĐRL)</label>
          <input type="number" id="evt-points" value="10">
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">🚩 Khởi Tạo Sự Kiện Mới</button>
    </form>
  `;
  showModal('Tạo Hoạt Động / Sự Kiện Mới', modalHTML);
}

async function handleCreateEventSubmit(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('evt-title').value,
    category: document.getElementById('evt-cat').value,
    location: document.getElementById('evt-loc').value,
    max_participants: parseInt(document.getElementById('evt-max').value) || 50,
    base_points: parseFloat(document.getElementById('evt-points').value) || 10.0
  };

  try {
    const res = await API.post('/events', payload);
    showToast(res.message || 'Tạo sự kiện mới thành công!', 'success');
    closeModal();
    loadEventsList();
  } catch (err) {
    showToast('Lỗi: ' + (err.message || 'Không thể tạo sự kiện'), 'error');
    console.error('handleCreateEventSubmit error:', err);
  }
}

function openQrCheckInModal(eventId, eventTitle) {
  const modalHTML = `
    <div style="text-align:center; padding:0.5rem;">
      <h3 style="font-size:1.15rem; font-weight:700; color:var(--text-primary); margin-bottom:0.3rem;">Quét Mã QR Điểm danh</h3>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.25rem;">Sự kiện: <strong>${escapeHTML(eventTitle)}</strong></p>
      
      <div style="width:180px; height:180px; margin:0 auto 1.25rem; background:var(--bg-main); border:2px dashed var(--primary-300); border-radius:var(--radius-xl); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:0.5rem;">
        <span style="font-size:3rem;">📱</span>
        <span style="font-size:0.75rem; color:var(--text-muted);">Hướng camera vào mã QR</span>
      </div>

      <div style="margin-bottom:1rem; text-align:left;">
        <label>Nhập MSSV / Member ID thủ công:</label>
        <input type="text" id="checkin-member-id" placeholder="STH-2026-001">
      </div>

      <button class="btn btn-primary btn-block" onclick="executeCheckIn('${eventId}')">✅ Xác nhận Check-in (+10 ĐRL)</button>
    </div>
  `;
  showModal('Điểm danh Sự kiện', modalHTML);
}

async function executeCheckIn(eventId) {
  const memberId = document.getElementById('checkin-member-id')?.value.trim();
  if (!memberId) {
    showToast('Vui lòng nhập MSSV hoặc Member ID!', 'warning');
    return;
  }

  try {
    const res = await API.post(`/events/${eventId}/attendance`, {
      session_id: 'default_session',
      member_id: memberId,
      check_in_method: 'qr_code'
    });

    showToast(res.message || 'Check-in điểm danh thành công!', 'success');
    closeModal();
    loadEventsList();
  } catch (err) {
    showToast('Lỗi điểm danh: ' + (err.message || 'Không thể check-in'), 'error');
    console.error('executeCheckIn error:', err);
  }
}

// Expose to global
window.loadEventsList = loadEventsList;
window.openCreateEventModal = openCreateEventModal;
window.handleCreateEventSubmit = handleCreateEventSubmit;
window.openQrCheckInModal = openQrCheckInModal;
window.executeCheckIn = executeCheckIn;
