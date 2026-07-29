/**
 * Sen Trắng Hub — Leaderboard & Electronic Certificates Module
 */

async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;

  container.innerHTML = '<div class="text-center">Đang tải bảng xếp hạng...</div>';

  try {
    const res = await API.get('/certificates/leaderboard');
    const list = res.data || (Array.isArray(res) ? res : []);

    if (list.length === 0) {
      container.innerHTML = '<div class="text-center">Chưa có dữ liệu tích điểm rèn luyện.</div>';
      return;
    }

    const rankStyles = {
      1: { bg: 'linear-gradient(135deg, #FFF8E1, #FFE082)', border: '#FFD600', emoji: '🥇', shadow: '0 4px 15px rgba(255, 214, 0, 0.2)' },
      2: { bg: 'linear-gradient(135deg, #F5F5F5, #E0E0E0)', border: '#BDBDBD', emoji: '🥈', shadow: '0 4px 15px rgba(189, 189, 189, 0.2)' },
      3: { bg: 'linear-gradient(135deg, #FBE9E7, #FFCCBC)', border: '#FF8A65', emoji: '🥉', shadow: '0 4px 15px rgba(255, 138, 101, 0.2)' }
    };

    container.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
        ${list.map(item => {
          const rank = rankStyles[item.rank];
          const isTopRank = item.rank <= 3;
          const bgStyle = isTopRank ? `background:${rank.bg}; border:1px solid ${rank.border}; box-shadow:${rank.shadow};` : 'background:var(--bg-card); border:1px solid var(--border-light); box-shadow:var(--shadow-sm);';

          return `
            <div style="${bgStyle} border-radius:var(--radius-xl); padding:1.25rem; display:flex; align-items:center; gap:1rem; transition:all 0.25s ease;" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='none'">
              <div style="width:44px; height:44px; border-radius:50%; background:${isTopRank ? 'transparent' : 'var(--bg-main)'}; display:flex; align-items:center; justify-content:center; font-size:${isTopRank ? '1.6rem' : '1rem'}; font-weight:800; color:${isTopRank ? 'inherit' : 'var(--text-muted)'}; flex-shrink:0;">
                ${isTopRank ? rank.emoji : item.rank}
              </div>
              <div style="flex:1; min-width:0;">
                <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-primary); margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(item.full_name)}</h4>
                <p style="font-size:0.75rem; color:var(--text-muted); margin:0.15rem 0;">${escapeHTML(item.generation || 'Gen 1')} • ${escapeHTML(item.department || 'Ban Chuyên môn')}</p>
                <div style="font-size:0.825rem; font-weight:800; color:var(--accent-green); margin-top:0.2rem;">⚡ ${item.total_points || 0} điểm</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="issueCertificateModal('${item.id}')" style="flex-shrink:0;">📜 Chứng nhận</button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="text-center text-danger">Lỗi tải bảng xếp hạng: ${escapeHTML(err.message)}</div>`;
    console.error('loadLeaderboard error:', err);
  }
}

async function issueCertificateModal(memberId) {
  try {
    const res = await API.get(`/certificates/${memberId}/issue`);
    const cert = res.certificate;

    if (!cert) {
      showToast('Không thể tạo chứng nhận cho thành viên này', 'error');
      return;
    }

    const modalHTML = `
      <div style="background: linear-gradient(135deg, #FFFDE7 0%, #FFF8E1 50%, #FFF3E0 100%); border: 3px double #FFD600; padding: 2rem; border-radius: var(--radius-xl); text-align: center; color: #4E342E; box-shadow: inset 0 0 40px rgba(255, 214, 0, 0.1);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌸</div>
        <h2 style="font-size: 1.3rem; font-weight: 800; color: #BF360C; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 0.25rem;">${escapeHTML(cert.title)}</h2>
        <p style="font-size: 0.75rem; font-weight: 600; color: #E65100; text-transform: uppercase; margin-bottom: 1.5rem;">Mã xác thực: <strong>${escapeHTML(cert.certificate_id)}</strong></p>
        
        <p style="font-size: 0.9rem; color: #3E2723;">Trân trọng vinh danh và trao chứng nhận cho:</p>
        <h1 style="font-size: 1.75rem; font-weight: 900; color: #BF360C; margin: 0.5rem 0; letter-spacing: 0.02em;">${escapeHTML(cert.recipient_name)}</h1>
        <p style="font-size: 0.825rem; color: #5D4037;">Thành viên thuộc <strong>${escapeHTML(cert.generation)} — ${escapeHTML(cert.department)}</strong></p>

        <div style="margin: 1.5rem 0; padding: 1rem; background: rgba(255,255,255,0.7); border-radius: var(--radius-md); border: 1px solid #FFE082; font-size: 0.875rem; color: #3E2723; line-height: 1.65;">
          ${escapeHTML(cert.reason)}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 1.5rem; font-size: 0.775rem; color: #5D4037;">
          <div style="text-align:left;">
            <div>Điểm rèn luyện: <strong>${cert.total_points} điểm</strong></div>
            <div>Ngày cấp: ${escapeHTML(cert.issued_date)}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: #BF360C;">${escapeHTML(cert.issued_by)}</div>
            <div style="font-size: 0.7rem; color: #8D6E63; margin-top: 0.2rem;">(Ký xác thực điện tử)</div>
          </div>
        </div>

        <div style="margin-top: 1.5rem;">
          <button class="btn btn-primary btn-sm" onclick="window.print()">🖨️ In / Tải PDF</button>
        </div>
      </div>
    `;

    showModal('Giấy Chứng nhận Điện tử', modalHTML);
  } catch (err) {
    showToast('Lỗi tạo chứng nhận: ' + (err.message || 'Không thể tạo chứng nhận'), 'error');
    console.error('issueCertificateModal error:', err);
  }
}

// Expose to global
window.loadLeaderboard = loadLeaderboard;
window.issueCertificateModal = issueCertificateModal;
