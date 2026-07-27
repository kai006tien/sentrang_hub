/**
 * Sen Trắng Hub — Leaderboard & Electronic Certificates JavaScript Module
 */

async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;

  container.innerHTML = `<div class="text-center">Đang tải bảng xếp hạng vinh danh...</div>`;

  try {
    const res = await API.get('/certificates/leaderboard');
    const list = res.data || [];

    if (list.length === 0) {
      container.innerHTML = `<div class="text-center">Chưa có dữ liệu tích điểm rèn luyện.</div>`;
      return;
    }

    container.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
        ${list.map(item => `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:1.25rem; display:flex; align-items:center; gap:1rem; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
            <div style="width:40px; height:40px; border-radius:50%; background:${item.rank === 1 ? '#f59e0b' : item.rank === 2 ? '#94a3b8' : item.rank === 3 ? '#b45309' : '#e2e8f0'}; color:${item.rank <= 3 ? '#ffffff' : '#0f172a'}; font-weight:800; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
              ${item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
            </div>
            <div style="flex:1;">
              <h4 style="font-size:1rem; font-weight:700; color:#0f172a; margin:0;">${escapeHTML(item.full_name)}</h4>
              <p style="font-size:0.8rem; color:#64748b; margin:0.1rem 0;">${escapeHTML(item.generation || 'Gen 1')} • ${escapeHTML(item.department || 'Ban Chuyên môn')}</p>
              <div style="font-size:0.85rem; font-weight:800; color:#059669; margin-top:0.3rem;">⚡ ${item.total_points || 0} điểm rèn luyện</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="issueCertificateModal('${item.id}')">📜 Chứng nhận</button>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="text-center text-danger">Lỗi tải bảng xếp hạng: ${escapeHTML(err.message)}</div>`;
  }
}

async function issueCertificateModal(memberId) {
  try {
    const res = await API.get(`/certificates/${memberId}/issue`);
    const cert = res.certificate;

    const modalHTML = `
      <div style="background: linear-gradient(135deg, #fffdfa 0%, #fff7ed 100%); border: 3px double #f59e0b; padding: 2rem; border-radius: 16px; text-align: center; font-family: 'Playfair Display', serif; color: #7c2d12; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.2);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌸</div>
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #9a3412; letter-spacing: 0.05em; text-transform: uppercase;">${escapeHTML(cert.title)}</h2>
        <p style="font-size: 0.8rem; font-weight: 600; color: #b45309; text-transform: uppercase; margin-bottom: 1.5rem;">Mã xác thực: <strong>${cert.certificate_id}</strong></p>
        
        <p style="font-size: 0.95rem; color: #431407; font-family: 'Inter', sans-serif;">Trân trọng vinh danh và trao chứng nhận cho:</p>
        <h1 style="font-size: 2rem; font-weight: 800; color: #991b1b; margin: 0.5rem 0; letter-spacing: 0.02em;">${escapeHTML(cert.recipient_name)}</h1>
        <p style="font-size: 0.85rem; color: #78350f; font-family: 'Inter', sans-serif;">Thành viên thuộc <strong>${escapeHTML(cert.generation)} — ${escapeHTML(cert.department)}</strong></p>

        <div style="margin: 1.5rem 0; padding: 1rem; background: rgba(255,255,255,0.7); border-radius: 12px; border: 1px solid #fed7aa; font-family: 'Inter', sans-serif; font-size: 0.9rem; color: #451a03; line-height: 1.6;">
          ${escapeHTML(cert.reason)}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 2rem; font-family: 'Inter', sans-serif; font-size: 0.8rem; color: #78350f;">
          <div>
            <div>Điểm rèn luyện: <strong>${cert.total_points} điểm</strong></div>
            <div>Ngày cấp: ${cert.issued_date}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: #991b1b;">${cert.issued_by}</div>
            <div style="font-size: 0.75rem; color: #92400e; margin-top: 0.2rem;">(Đã ký xác thực điện tử System Hash)</div>
          </div>
        </div>

        <div style="margin-top: 1.5rem; text-align: center;">
          <button class="btn btn-primary" onclick="window.print()">🖨️ In / Tải về File PDF</button>
        </div>
      </div>
    `;

    showModal('Giấy Chứng nhận Điện tử', modalHTML);
  } catch (err) {
    alert('Lỗi tạo chứng nhận: ' + err.message);
  }
}
