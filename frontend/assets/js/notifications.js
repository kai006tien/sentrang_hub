/**
 * Sen Trắng Hub v2 — Notifications Module
 * Features: Create, list, read notifications
 */

async function loadNotificationsList() {
  const container = document.getElementById('notifications-container');
  const actionsEl = document.getElementById('noti-action-buttons');
  if (!container) return;

  if (actionsEl) {
    actionsEl.innerHTML = (hasPermission('notifications.create') || isSuperAdmin()) ? `<button class="btn btn-primary btn-sm" onclick="openCreateNotificationModal()">+ Tạo thông báo</button>` : '';
  }
  container.innerHTML = '<div class="text-center">Đang tải...</div>';
  try {
    const res = await apiFetch('/api/notifications');
    const list = res.data || (Array.isArray(res) ? res : []);
    if (list.length === 0) { container.innerHTML = '<div class="text-center" style="padding:2rem;color:var(--text-muted);">Chưa có thông báo nào.</div>'; return; }

    const user = Auth.getUser();
    const typeStyles = {
      info: { icon: 'ℹ️', bg: '#E3F2FD', border: '#42A5F5' },
      warning: { icon: '⚠️', bg: '#FFF3E0', border: '#FF9800' },
      important: { icon: '🔴', bg: '#FFEBEE', border: '#EF5350' }
    };

    container.innerHTML = list.map(n => {
      const t = typeStyles[n.type] || typeStyles.info;
      const isRead = n.read_by && n.read_by.includes(user?.id);
      return `<div style="display:flex;gap:1rem;align-items:flex-start;padding:1rem;border-left:4px solid ${t.border};background:${isRead ? 'var(--bg-card)' : t.bg};border-radius:0 var(--radius-md) var(--radius-md) 0;margin-bottom:0.75rem;transition:all 0.2s ease;opacity:${isRead ? '0.7' : '1'};" onmouseenter="this.style.transform='translateX(4px)'" onmouseleave="this.style.transform='none'">
        <span style="font-size:1.3rem;flex-shrink:0;">${t.icon}</span>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;flex-wrap:wrap;">
            <h4 style="font-size:0.95rem;font-weight:700;margin:0;">${escapeHTML(n.title)}</h4>
            <span style="font-size:0.7rem;color:var(--text-muted);white-space:nowrap;">${new Date(n.created_at||Date.now()).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
          </div>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin:0.35rem 0 0.5rem;line-height:1.55;">${escapeHTML(n.content)}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.72rem;color:var(--text-muted);">Gửi bởi: <strong>${escapeHTML(n.created_by||'Hệ thống')}</strong></span>
            ${!isRead ? `<button class="btn btn-secondary btn-sm" onclick="markNotificationRead('${n.id}',this)" style="font-size:0.72rem;">✓ Đã đọc</button>` : '<span style="font-size:0.72rem;color:var(--accent-green);font-weight:600;">✓ Đã xem</span>'}
          </div>
        </div>
      </div>`;
    }).join('');
  } catch (err) { container.innerHTML = `<div class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</div>`; }
}

async function markNotificationRead(notiId, btn) {
  try {
    const user = Auth.getUser();
    await API.put(`/notifications/${notiId}/read`, { user_id: user?.id });
    if (btn) { btn.outerHTML = '<span style="font-size:0.72rem;color:var(--accent-green);font-weight:600;">✓ Đã xem</span>'; }
    updateNotiBadge();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

function openCreateNotificationModal() {
  showModal('📢 Tạo Thông Báo Mới', `
    <form onsubmit="handleCreateNotificationSubmit(event)">
      <div style="margin-bottom:0.85rem;"><label>Tiêu đề thông báo *</label><input type="text" id="noti-title" required placeholder="Thông báo quan trọng..."></div>
      <div style="margin-bottom:0.85rem;"><label>Nội dung thông báo *</label><textarea id="noti-content" rows="4" required placeholder="Nội dung chi tiết thông báo..."></textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:1.25rem;">
        <div><label>Mức độ</label><select id="noti-type"><option value="info">Thông thường</option><option value="warning">Cảnh báo</option><option value="important">Quan trọng</option></select></div>
        <div><label>Gửi đến</label><select id="noti-target"><option value="all">Tất cả thành viên</option><option value="role_chu_nhiem">Chỉ BCN</option><option value="role_truong_ban">Chỉ Trưởng ban</option></select></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">📢 Gửi Thông Báo</button>
    </form>`);
}

async function handleCreateNotificationSubmit(e) {
  e.preventDefault();
  const user = Auth.getUser();
  try {
    const res = await API.post('/notifications', {
      title: document.getElementById('noti-title').value,
      content: document.getElementById('noti-content').value,
      type: document.getElementById('noti-type').value,
      target: document.getElementById('noti-target').value,
      created_by: user?.display_name || 'Admin'
    });
    showToast(res.message || 'Gửi thông báo thành công!', 'success');
    closeModal(); loadNotificationsList(); updateNotiBadge();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

window.loadNotificationsList = loadNotificationsList;
window.markNotificationRead = markNotificationRead;
window.openCreateNotificationModal = openCreateNotificationModal;
window.handleCreateNotificationSubmit = handleCreateNotificationSubmit;
