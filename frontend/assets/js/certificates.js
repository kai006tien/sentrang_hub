/**
 * Sen Trắng Hub v2 — Certificates Module (Permission-gated)
 */

async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  const actionsEl = document.getElementById('cert-action-buttons');
  if (!container) return;

  if (actionsEl) {
    actionsEl.innerHTML = (hasPermission('certificates.issue') || isSuperAdmin()) ? `<button class="btn btn-primary btn-sm" onclick="openCreateCertificateModal()">🎖️ Cấp chứng nhận</button>` : '';
  }
  container.innerHTML = '<div class="text-center">Đang tải...</div>';
  try {
    const res = await apiFetch('/api/certificates/leaderboard');
    const list = res.data || (Array.isArray(res) ? res : []);
    if (list.length === 0) { container.innerHTML = '<div class="text-center">Chưa có dữ liệu.</div>'; return; }

    const medals = ['🥇','🥈','🥉'];
    const canIssue = hasPermission('certificates.issue') || isSuperAdmin();
    container.innerHTML = `
      <div class="table-responsive"><table class="data-table">
        <thead><tr><th>Hạng</th><th>Thành viên</th><th>Thế hệ / Ban</th><th>Điểm thành tích</th><th>Hành động</th></tr></thead>
        <tbody>${list.map(m => `
          <tr>
            <td><span style="font-size:1.5rem;">${medals[m.rank-1]||m.rank}</span></td>
            <td><strong>${escapeHTML(m.full_name)}</strong></td>
            <td><span style="font-size:0.825rem;color:var(--text-muted);">${escapeHTML(m.generation)} • ${escapeHTML(m.department)}</span></td>
            <td><span style="font-weight:800;color:var(--primary-700);font-size:1.1rem;">${m.total_points}</span> ĐTT</td>
            <td>
              ${canIssue ? `<button class="btn btn-secondary btn-sm" onclick="issueCertificate('${m.id}')">📜 Cấp</button>` : '<span style="font-size:0.75rem;color:var(--text-muted);">—</span>'}
            </td>
          </tr>
        `).join('')}</tbody>
      </table></div>`;
  } catch (err) { container.innerHTML = `<div class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</div>`; }
}

async function issueCertificate(memberId) {
  try {
    const res = await apiFetch(`/api/certificates/${memberId}/issue`);
    const cert = res.certificate;
    if (!cert) { showToast('Lỗi tạo chứng nhận!', 'error'); return; }
    showModal('🎖️ Giấy Chứng Nhận', `
      <div style="text-align:center;background:linear-gradient(135deg,#FFF8E1,#FFF3E0);padding:2rem;border-radius:var(--radius-xl);border:2px solid #FFB74D;">
        <div style="font-size:0.8rem;color:#E65100;font-weight:700;margin-bottom:0.5rem;letter-spacing:1px;">CLB THANH NIÊN TÌNH NGUYỆN SEN TRẮNG</div>
        <h2 style="font-size:1.35rem;font-weight:800;color:#BF360C;margin-bottom:0.35rem;">${escapeHTML(cert.title)}</h2>
        <div style="width:50px;height:3px;background:#FF9800;margin:0.5rem auto 1rem;border-radius:2px;"></div>
        <p style="font-size:1.1rem;font-weight:700;color:#1A237E;margin-bottom:0.3rem;">${escapeHTML(cert.recipient_name)}</p>
        <p style="font-size:0.825rem;color:var(--text-muted);margin-bottom:1rem;">${escapeHTML(cert.generation)} — ${escapeHTML(cert.department)}</p>
        <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;margin-bottom:1.25rem;">${escapeHTML(cert.reason)}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:1rem;border-top:1px solid rgba(0,0,0,0.1);">
          <span style="font-size:0.75rem;color:var(--text-muted);">📅 ${cert.issued_date}</span>
          <span style="font-size:0.75rem;font-weight:700;color:#1565C0;">${escapeHTML(cert.certificate_id)}</span>
        </div>
        <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.75rem;">Ký bởi: <strong>${escapeHTML(cert.issued_by)}</strong></p>
      </div>
    `);
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

// === CREATE CUSTOM CERTIFICATE ===
function openCreateCertificateModal() {
  showModal('🎖️ Tạo Giấy Chứng Nhận', `
    <form onsubmit="handleCreateCertSubmit(event)">
      <div style="margin-bottom:0.85rem;"><label>Tiêu đề chứng nhận *</label><input type="text" id="cert-title" required value="GIẤY CHỨNG NHẬN THÀNH TÍCH XUẤT SẮC"></div>
      <div style="margin-bottom:0.85rem;"><label>Tên người nhận *</label><input type="text" id="cert-recipient" required placeholder="Nguyễn Văn A"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:0.85rem;">
        <div><label>Thế hệ</label><input type="text" id="cert-gen" value="Gen 12"></div>
        <div><label>Ban</label><input type="text" id="cert-dept" value="Ban Phong trào"></div>
      </div>
      <div style="margin-bottom:0.85rem;"><label>Lý do cấp *</label><textarea id="cert-reason" rows="3" required placeholder="Ghi nhận thành tích xuất sắc..."></textarea></div>
      <div style="margin-bottom:1.25rem;"><label>Ký bởi</label><input type="text" id="cert-issuer" value="Ban Chủ nhiệm CLB Sen Trắng"></div>
      <button type="submit" class="btn btn-primary btn-block">🎖️ Cấp Chứng Nhận</button>
    </form>`);
}

async function handleCreateCertSubmit(e) {
  e.preventDefault();
  try {
    const res = await API.post('/certificates', {
      title: document.getElementById('cert-title').value,
      recipient_name: document.getElementById('cert-recipient').value,
      generation: document.getElementById('cert-gen').value,
      department: document.getElementById('cert-dept').value,
      reason: document.getElementById('cert-reason').value,
      issued_by: document.getElementById('cert-issuer').value
    });
    showToast(res.message || 'Cấp chứng nhận thành công!', 'success');
    closeModal();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

window.loadLeaderboard = loadLeaderboard;
window.issueCertificate = issueCertificate;
window.openCreateCertificateModal = openCreateCertificateModal;
window.handleCreateCertSubmit = handleCreateCertSubmit;
