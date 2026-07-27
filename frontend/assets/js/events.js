/**
 * Sen Trắng Hub — Events & Attendance Frontend Controller
 */

async function loadEventsList() {
  const container = document.getElementById('events-cards-container');
  if (!container) return;

  container.innerHTML = '<p style="color: var(--text-dim);">Đang tải danh sách sự kiện...</p>';

  try {
    const events = await apiFetch('/api/events');

    if (events.length === 0) {
      container.innerHTML = '<p style="color: var(--text-dim);">Chưa có sự kiện nào. Hãy ấn "Tạo sự kiện mới" để bắt đầu.</p>';
      return;
    }

    container.innerHTML = events.map(e => `
      <div class="card-box" style="margin-bottom: 0;">
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="badge badge-active">${e.category}</span>
            <span style="font-size: 0.75rem; color: var(--text-dim);">${new Date(e.start_date).toLocaleDateString('vi-VN')}</span>
          </div>
          <button class="btn-sm btn-outline" onclick="openQrCheckInModal('${e.id}', '${e.title}')">📷 QR Điểm danh</button>
        </div>
        <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">${e.title}</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">📍 ${e.location}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--primary-300);">
          <span>Đã đăng ký: <strong>${e.current_count}/${e.max_participants}</strong></span>
          <span>+${e.base_points} ĐRL</span>
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<p style="color: var(--accent-red);">Lỗi: ${err.message}</p>`;
  }
}

function openCreateEventModal() {
  const modal = document.getElementById('modal-create-event');
  if (modal) modal.classList.add('active');
}

async function handleCreateEventSubmit(e) {
  e.preventDefault();
  
  const payload = {
    title: document.getElementById('event-title').value,
    category: document.getElementById('event-category').value,
    location: document.getElementById('event-location').value,
    start_date: new Date(document.getElementById('event-start').value).toISOString(),
    max_participants: parseInt(document.getElementById('event-max').value) || 50,
    base_points: parseFloat(document.getElementById('event-points').value) || 10.0,
    description: document.getElementById('event-desc').value
  };

  try {
    await apiFetch('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    showToast('Tạo sự kiện thành công!', 'success');
    closeModal('modal-create-event');
    loadEventsList();
  } catch (err) {
    showToast(err.message || 'Tạo sự kiện thất bại', 'error');
  }
}

let activeCheckInEventId = null;

function openQrCheckInModal(eventId, eventTitle) {
  activeCheckInEventId = eventId;
  const modal = document.getElementById('modal-qr-checkin');
  const title = document.getElementById('qr-event-title');
  if (!modal) return;

  title.textContent = eventTitle;
  modal.classList.add('active');
}

async function simulateCheckIn() {
  if (!activeCheckInEventId) return;
  const memberId = document.getElementById('checkin-member-id').value;

  if (!memberId) {
    showToast('Vui lòng nhập Member ID hoặc quét QR', 'error');
    return;
  }

  try {
    const res = await apiFetch('/api/events/check-in', {
      method: 'POST',
      body: JSON.stringify({
        event_id: activeCheckInEventId,
        session_id: 'default_session',
        member_id: memberId,
        method: 'qr_code'
      })
    });

    showToast(res.message, 'success');
    closeModal('modal-qr-checkin');
  } catch (err) {
    showToast(err.message || 'Điểm danh thất bại', 'error');
  }
}

window.loadEventsList = loadEventsList;
window.openCreateEventModal = openCreateEventModal;
window.handleCreateEventSubmit = handleCreateEventSubmit;
window.openQrCheckInModal = openQrCheckInModal;
window.simulateCheckIn = simulateCheckIn;
