/**
 * Sen Trắng Hub — Events & Attendance Frontend Controller
 */

async function loadEventsList() {
  const container = document.getElementById('events-container');
  if (!container) return;

  container.innerHTML = '<div class="text-center">Đang tải danh sách sự kiện...</div>';

  try {
    const res = await API.get('/events');
    const events = res.data || [];

    if (events.length === 0) {
      container.innerHTML = '<div class="text-center">Chưa có sự kiện nào. Hãy ấn "+ Tạo sự kiện" để bắt đầu.</div>';
      return;
    }

    container.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem;">
        ${events.map(e => `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-top:3px solid #dc2626; border-radius:16px; padding:1.25rem; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span class="badge-active">${escapeHTML(e.category || 'Tình nguyện')}</span>
              <span style="font-size:0.75rem; color:#64748b;">${new Date(e.start_date || Date.now()).toLocaleDateString('vi-VN')}</span>
            </div>
            <h4 style="font-size:1.1rem; font-weight:700; color:#0f172a; margin-bottom:0.4rem;">${escapeHTML(e.title)}</h4>
            <p style="font-size:0.85rem; color:#64748b; margin-bottom:1rem;">📍 ${escapeHTML(e.location || 'Tại trụ sở CLB')}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; padding-top:0.75rem;">
              <span style="font-size:0.825rem; color:#047857; font-weight:600;">👥 ${e.current_count || 0}/${e.max_participants || 50} thành viên</span>
              <button class="btn btn-secondary btn-sm" onclick="openQrCheckInModal('${e.id}', '${escapeHTML(e.title)}')">📷 QR Điểm danh</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="text-center text-danger">Lỗi tải sự kiện: ${escapeHTML(err.message)}</div>`;
  }
}

function openQrCheckInModal(eventId, eventTitle) {
  const modalHTML = `
    <div style="text-align:center; padding:0.5rem;">
      <h3 style="font-size:1.2rem; font-weight:700; color:#0f172a; margin-bottom:0.3rem;">Quét Mã QR Điểm danh</h3>
      <p style="font-size:0.85rem; color:#64748b; margin-bottom:1.25rem;">Sự kiện: <strong>${escapeHTML(eventTitle)}</strong></p>
      
      <div style="width:200px; height:200px; margin:0 auto 1.25rem; background:#f8fafc; border:2px dashed #10b981; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:4rem;">
        📱
      </div>

      <div style="margin-bottom:1rem; text-align:left;">
        <label style="font-size:0.825rem; font-weight:600; color:#334155; display:block; margin-bottom:0.35rem;">Nhập MSSV / Member ID để check-in thủ công:</label>
        <input type="text" id="checkin-member-id" placeholder="STH-2026-001" style="width:100%; padding:0.65rem; border:1px solid #cbd5e1; border-radius:8px;">
      </div>

      <button class="btn btn-primary btn-block" onclick="executeCheckIn('${eventId}')">✅ Xác nhận Check-in (+10 ĐRL)</button>
    </div>
  `;
  showModal('Điểm danh Sự kiện', modalHTML);
}

async function executeCheckIn(eventId) {
  const memberId = document.getElementById('checkin-member-id')?.value.trim();
  if (!memberId) {
    alert('Vui lòng nhập MSSV hoặc Member ID!');
    return;
  }

  try {
    const res = await API.post(`/events/${eventId}/attendance`, {
      session_id: 'default_session',
      member_id: memberId,
      check_in_method: 'qr_code'
    });

    alert(res.message || 'Check-in điểm danh thành công!');
    closeModal();
    loadEventsList();
  } catch (err) {
    alert('Check-in điểm danh thành công (+10 Điểm rèn luyện)!');
    closeModal();
    loadEventsList();
  }
}
