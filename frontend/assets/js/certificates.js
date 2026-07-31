let selectedLeaderboardYear = '2026';
let selectedLeaderboardCampaign = 'all'; // 'all', 'xuan_tinh_nguyen', 'thang_thanh_nien', 'he_tinh_nguyen', 'dong_tinh_nguyen'

function getCampaignFromDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const m = d.getMonth() + 1; // 1 to 12
  if (m >= 1 && m <= 2) return 'xuan_tinh_nguyen';
  if (m >= 3 && m <= 4) return 'thang_thanh_nien';
  if (m >= 5 && m <= 9) return 'he_tinh_nguyen';
  if (m >= 10 && m <= 12) return 'dong_tinh_nguyen';
  return 'all';
}

function changeLeaderboardYear(year) {
  selectedLeaderboardYear = year.toString();
  loadLeaderboard();
}

function changeLeaderboardCampaign(campaign) {
  selectedLeaderboardCampaign = campaign;
  loadLeaderboard();
}

async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  const actionsEl = document.getElementById('cert-action-buttons');
  if (!container) return;

  const canManage = hasPermission('certificates.issue') || isSuperAdmin();
  if (actionsEl) {
    let btns = canManage ? `<button class="btn btn-primary btn-sm" onclick="openPointsAdjustmentModal()">⚖️ Cộng / Trừ điểm vi phạm</button>` : '';
    if (isSuperAdmin()) {
      btns += ` <button class="btn btn-danger btn-sm" onclick="openResetModuleModal('leaderboard')">🔄 Reset Điểm</button>`;
    }
    actionsEl.innerHTML = btns;
  }
  container.innerHTML = '<div class="text-center">Đang tải...</div>';
  try {
    const res = await apiFetch('/api/certificates/leaderboard');
    const rawList = res.data || (Array.isArray(res) ? res : []);
    const years = res.years || ['2026', '2025', '2027'];
    if (!years.includes(selectedLeaderboardYear)) selectedLeaderboardYear = years[0] || '2026';

    // Auto-calculate points per member based on activity dates & selected Campaign/Year
    const processedList = rawList.map(m => {
      let filteredAtt = 0;
      let filteredBonus = 0;
      let filteredPenalty = 0;
      let filteredTotal = 0;

      const history = m.points_history || [];
      const matchingEntries = history.filter(entry => {
        const eDate = entry.date ? new Date(entry.date) : new Date();
        const entryYear = eDate.getFullYear().toString();
        if (entryYear !== selectedLeaderboardYear) return false;
        if (selectedLeaderboardCampaign === 'all') return true;
        const entryCamp = getCampaignFromDate(entry.date);
        return entryCamp === selectedLeaderboardCampaign;
      });

      if (history.length > 0) {
        matchingEntries.forEach(e => {
          const pts = e.points || 0;
          if (e.type === 'penalty' || pts < 0) {
            filteredPenalty += Math.abs(pts);
          } else if (e.type === 'bonus') {
            filteredBonus += Math.abs(pts);
          } else {
            filteredAtt += Math.abs(pts);
          }
        });
        filteredTotal = Math.max(0, filteredAtt + filteredBonus - filteredPenalty);
      } else {
        // Fallback baseline for initial data
        if (selectedLeaderboardYear === '2026' && selectedLeaderboardCampaign === 'all') {
          filteredAtt = m.attendance_points || 0;
          filteredBonus = m.bonus_points || 0;
          filteredPenalty = m.penalty_points || 0;
          filteredTotal = m.total_points || (filteredAtt + filteredBonus - filteredPenalty);
        }
      }

      return {
        ...m,
        calc_total: filteredTotal,
        calc_att: filteredAtt,
        calc_bonus: filteredBonus,
        calc_penalty: filteredPenalty
      };
    });

    processedList.sort((a, b) => b.calc_total - a.calc_total);
    processedList.forEach((m, idx) => { m.rank = idx + 1; });

    if (processedList.length === 0) {
      container.innerHTML = '<div class="text-center" style="padding:2.5rem;color:var(--text-muted);">Chưa có dữ liệu điểm cho năm này.</div>';
      return;
    }

    // 1. Calculate Achievement Point Statistics
    const totalClubPoints = processedList.reduce((acc, m) => acc + (m.calc_total || 0), 0);
    const avgPoints = Math.round(totalClubPoints / (processedList.length || 1));

    const officialDepts = ['Ban Chủ nhiệm', 'Ban Thư ký', 'Ban Điều hành', 'Ban Công tác Hoạt động'];
    const deptMap = {};
    officialDepts.forEach(d => { deptMap[d] = 0; });

    processedList.forEach(m => {
      const d = m.department || 'Ban Điều hành';
      if (deptMap[d] !== undefined) {
        deptMap[d] += (m.calc_total || 0);
      } else {
        deptMap['Ban Điều hành'] += (m.calc_total || 0);
      }
    });

    let topDeptName = 'Ban Chủ nhiệm';
    let maxDeptPts = -1;
    officialDepts.forEach(d => {
      if (deptMap[d] > maxDeptPts) {
        maxDeptPts = deptMap[d];
        topDeptName = d;
      }
    });

    const deptColors = {
      'Ban Chủ nhiệm': '#EF5350',
      'Ban Thư ký': '#AB47BC',
      'Ban Điều hành': '#42A5F5',
      'Ban Công tác Hoạt động': '#66BB6A'
    };

    const deptStatBars = officialDepts.map(dept => {
      const pts = deptMap[dept];
      const pct = Math.min(100, Math.round((pts / (totalClubPoints || 1)) * 100));
      const color = deptColors[dept] || '#42A5F5';
      return `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:0.825rem;font-weight:600;margin-bottom:0.25rem;">
            <span>🏢 ${escapeHTML(dept)}</span>
            <span style="color:var(--primary-700);">${pts} ĐTT (${pct}%)</span>
          </div>
          <div style="background:var(--bg-main);height:8px;border-radius:var(--radius-full);overflow:hidden;">
            <div style="background:${color};height:100%;width:${pct}%;border-radius:var(--radius-full);"></div>
          </div>
        </div>
      `;
    }).join('');

    const controlsHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-xl);padding:1rem 1.25rem;margin-bottom:1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
          <label style="font-weight:700;font-size:0.9rem;color:var(--primary-700);">🗓️ Chọn Năm Hoạt Động:</label>
          <select id="leaderboard-year-select" onchange="changeLeaderboardYear(this.value)" style="padding:0.45rem 0.85rem;border-radius:var(--radius-md);border:1.5px solid var(--primary-600);font-weight:700;color:var(--primary-700);background:var(--bg-card);">
            ${years.map(y => `<option value="${y}" ${y === selectedLeaderboardYear ? 'selected' : ''}>Năm Hoạt Động ${y}</option>`).join('')}
          </select>
          ${canManage ? `<button class="btn btn-secondary btn-sm" onclick="openCreateYearModal()">+ Tạo năm mới</button>` : ''}
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted);">
          ⚡ Tự động thống kê dựa theo ngày điểm danh diễn ra hoạt động
        </div>
      </div>

      <div class="campaign-pill-scroll">
        <button class="campaign-pill-btn ${selectedLeaderboardCampaign === 'all' ? 'active' : ''}" onclick="changeLeaderboardCampaign('all')">🏆 Tổng kết năm (12 Tháng)</button>
        <button class="campaign-pill-btn ${selectedLeaderboardCampaign === 'xuan_tinh_nguyen' ? 'active' : ''}" onclick="changeLeaderboardCampaign('xuan_tinh_nguyen')">🌸 Xuân Tình Nguyện (Tháng 1-2)</button>
        <button class="campaign-pill-btn ${selectedLeaderboardCampaign === 'thang_thanh_nien' ? 'active' : ''}" onclick="changeLeaderboardCampaign('thang_thanh_nien')">⚡ Tháng Thanh Niên (Tháng 3-4)</button>
        <button class="campaign-pill-btn ${selectedLeaderboardCampaign === 'he_tinh_nguyen' ? 'active' : ''}" onclick="changeLeaderboardCampaign('he_tinh_nguyen')">☀️ Hè Tình Nguyện (Tháng 5-9)</button>
        <button class="campaign-pill-btn ${selectedLeaderboardCampaign === 'dong_tinh_nguyen' ? 'active' : ''}" onclick="changeLeaderboardCampaign('dong_tinh_nguyen')">❄️ Đông Tình Nguyện (Tháng 10-12)</button>
      </div>
    `;

    const statsHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-xl);padding:1.25rem;margin-bottom:1.5rem;box-shadow:var(--shadow-sm);">
        <h3 style="font-size:1rem;font-weight:700;color:var(--primary-700);margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;">
          📊 Thống kê Điểm Thành tích Theo Ban (${selectedLeaderboardYear})
        </h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:1rem;margin-bottom:1.25rem;">
          <div style="background:var(--bg-main);padding:0.85rem;border-radius:var(--radius-lg);border:1px solid var(--border-light);">
            <div style="font-size:0.75rem;color:var(--text-muted);">🏆 Tổng điểm thành tích CLB</div>
            <div style="font-size:1.35rem;font-weight:800;color:var(--primary-600);">${totalClubPoints} ĐTT</div>
          </div>
          <div style="background:var(--bg-main);padding:0.85rem;border-radius:var(--radius-lg);border:1px solid var(--border-light);">
            <div style="font-size:0.75rem;color:var(--text-muted);">📊 Điểm TB / Thành viên</div>
            <div style="font-size:1.35rem;font-weight:800;color:var(--accent-green);">${avgPoints} ĐTT</div>
          </div>
          <div style="background:var(--bg-main);padding:0.85rem;border-radius:var(--radius-lg);border:1px solid var(--border-light);">
            <div style="font-size:0.75rem;color:var(--text-muted);">🥇 Ban dẫn đầu điểm số</div>
            <div style="font-size:1.1rem;font-weight:800;color:var(--primary-700);">${escapeHTML(topDeptName)}</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          ${deptStatBars}
        </div>
      </div>
    `;

    // 2. Leaderboard Table
    const medals = ['🥇','🥈','🥉'];
    const tableHTML = `
      <div class="table-responsive"><table class="data-table">
        <thead><tr><th>Hạng</th><th>Thành viên</th><th>Ban hoạt động</th><th>Điểm thành tích (${selectedLeaderboardYear})</th><th>Hành động</th></tr></thead>
        <tbody>${processedList.map(m => `
          <tr>
            <td><span style="font-size:1.5rem;">${medals[m.rank-1]||m.rank}</span></td>
            <td>
              <strong>${escapeHTML(m.full_name)}</strong>
              <div style="font-size:0.75rem;color:var(--text-muted);">MSTN: ${escapeHTML(m.student_id||'N/A')}</div>
            </td>
            <td><span style="font-size:0.825rem;color:var(--text-muted);">${escapeHTML(m.department || 'Ban Điều hành')}</span></td>
            <td>
              <span style="font-weight:800;color:var(--primary-700);font-size:1.1rem;">${m.calc_total||0}</span> ĐTT
              <div style="font-size:0.72rem;color:var(--text-muted);">Điểm danh: ${m.calc_att||0} | Thưởng: +${m.calc_bonus||0} | Phạt: -${m.calc_penalty||0}</div>
            </td>
            <td>
              <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                ${canManage ? `
                  <button class="btn btn-secondary btn-sm" onclick="openCreateCertificateModalForUser('${m.id}')">📜 Cấp</button>
                  <button class="btn btn-secondary btn-sm" onclick="openPointsAdjustmentModal('${m.id}')">⚖️ Cộng/Trừ</button>
                ` : '<span style="font-size:0.75rem;color:var(--text-muted);">—</span>'}
              </div>
            </td>
          </tr>
        `).join('')}</tbody>
      </table></div>`;

    container.innerHTML = controlsHTML + statsHTML + tableHTML;
  } catch (err) { container.innerHTML = `<div class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</div>`; }
}

async function issueCertificate(memberId) {
  try {
    const res = await apiFetch(`/api/certificates/${memberId}/issue`);
    const cert = res.certificate;
    if (!cert) { showToast('Lỗi tạo chứng nhận!', 'error'); return; }
    displayCertificateModal(cert);
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

function displayCertificateModal(cert) {
  const issueDate = cert.issued_date || new Date().toLocaleDateString('vi-VN');
  const certId = cert.certificate_id || ('CERT-STH-' + Date.now().toString().slice(-6));
  const issuer = cert.issued_by || 'Ban Chủ nhiệm CLB Sen Trắng';
  
  showModal('🎖️ Bằng Khen Vinh Danh — CLB Sen Trắng', `
    <div class="cert-gold-frame" style="position:relative;background:linear-gradient(145deg, #FFFDF5 0%, #FFF8E7 50%, #FFF3D6 100%);padding:2rem 1.5rem;border-radius:16px;border:3px double #D4AF37;box-shadow:0 12px 35px rgba(184,134,11,0.25);text-align:center;overflow:hidden;box-sizing:border-box;">
      
      <!-- Corner Ornaments -->
      <div style="position:absolute;top:8px;left:12px;font-size:1.2rem;color:#B8860B;">⚜️</div>
      <div style="position:absolute;top:8px;right:12px;font-size:1.2rem;color:#B8860B;">⚜️</div>
      <div style="position:absolute;bottom:8px;left:12px;font-size:1.2rem;color:#B8860B;">⚜️</div>
      <div style="position:absolute;bottom:8px;right:12px;font-size:1.2rem;color:#B8860B;">⚜️</div>

      <!-- Watermark Background -->
      <img src="assets/images/logo.png" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:220px;height:220px;opacity:0.06;pointer-events:none;" alt="Watermark">

      <!-- Header Header Logo & Org -->
      <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:1.25rem;">
        <img src="assets/images/logo.png" style="width:64px;height:64px;object-fit:contain;border:2.5px solid #FFFFFF;border-radius:14px;background:#FFFFFF;box-shadow:0 4px 12px rgba(184,134,11,0.25);margin-bottom:0.6rem;" alt="Sen Trắng Logo">
        <div style="font-size:0.78rem;font-weight:900;color:#996515;letter-spacing:1.5px;text-transform:uppercase;">CLB THANH NIÊN TÌNH NGUYỆN SEN TRẮNG</div>
        <div style="font-size:0.68rem;font-weight:700;color:#795548;margin-top:0.2rem;letter-spacing:0.5px;">HỆ THỐNG QUẢN TRỊ & QUẢN LÝ NỘI BỘ</div>
      </div>

      <!-- Divider -->
      <div style="display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-bottom:1.25rem;">
        <div style="height:1.5px;width:60px;background:linear-gradient(90deg,transparent,#D4AF37);"></div>
        <span style="color:#D4AF37;font-size:0.9rem;">★ ★ ★</span>
        <div style="height:1.5px;width:60px;background:linear-gradient(90deg,#D4AF37,transparent);"></div>
      </div>

      <!-- Main Title -->
      <div style="font-size:0.8rem;font-weight:700;color:#5D4037;letter-spacing:2px;text-transform:uppercase;margin-bottom:0.25rem;">TRAO TẶNG</div>
      <h2 style="font-size:1.45rem;font-weight:900;color:#8B0000;text-transform:uppercase;margin:0 0 0.75rem 0;line-height:1.3;text-shadow:0 1px 2px rgba(0,0,0,0.1);">
        ${escapeHTML(cert.title)}
      </h2>

      <!-- Recipient -->
      <div style="background:rgba(255,255,255,0.7);border:1px solid rgba(212,175,55,0.4);border-radius:12px;padding:0.85rem 1.25rem;margin-bottom:1.25rem;display:inline-block;max-width:100%;box-sizing:border-box;">
        <div style="font-size:0.75rem;color:#795548;margin-bottom:0.2rem;">Chứng nhận Thành viên:</div>
        <div style="font-size:1.3rem;font-weight:900;color:#1A237E;margin-bottom:0.25rem;word-break:break-word;">
          ${escapeHTML(cert.recipient_name)}
        </div>
        <div style="font-size:0.825rem;font-weight:700;color:#2E7D32;">
          🏛️ ${escapeHTML(cert.department || 'Ban Công tác Hoạt động')}
        </div>
      </div>

      <!-- Reason -->
      <div style="font-size:0.875rem;color:#3E2723;line-height:1.6;margin-bottom:1.5rem;padding:0 0.5rem;font-style:italic;">
        "${escapeHTML(cert.reason)}"
      </div>

      <!-- Signature & Official Red Seal Footer -->
      <div class="cert-footer-container">
        <div class="cert-footer-left">
          <div style="font-size:0.72rem;color:#795548;margin-bottom:0.2rem;font-weight:700;">MÃ SỐ BẰNG KHEN</div>
          <div style="font-size:0.75rem;font-weight:800;color:#1565C0;background:rgba(21,101,192,0.08);padding:0.25rem 0.5rem;border-radius:4px;display:inline-block;">
            ${escapeHTML(certId)}
          </div>
          <div style="font-size:0.72rem;color:#795548;margin-top:0.35rem;">📅 Ngày cấp: <strong>${escapeHTML(issueDate)}</strong></div>
        </div>

        <div class="cert-footer-center">
          <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#FFD700,#FF9800);border:2px solid #FFF;box-shadow:0 4px 10px rgba(255,152,0,0.4);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:#FFF;margin:0 auto;">
            🎖️
          </div>
          <div style="font-size:0.62rem;font-weight:800;color:#B8860B;margin-top:0.15rem;">VINH DANH</div>
        </div>

        <div class="cert-signature-block">
          <div class="cert-sig-title">TM. BAN CHỦ NHIỆM CLB</div>
          <div class="cert-sig-signed">(Đã Ký)</div>
          <div class="cert-sig-issuer">${escapeHTML(issuer)}</div>
          <img src="assets/images/seal.png" class="cert-red-seal-img" alt="Mộc Đỏ CLB Sen Trắng">
        </div>
      </div>
    </div>
  `);
}

async function openCreateCertificateModal() {
  let members = [];
  try {
    const res = await apiFetch('/api/members');
    members = Array.isArray(res) ? res : (res.data || []);
  } catch {}

  const memberOptions = members.map(m => `
    <option value="${m.id}" data-name="${escapeHTML(m.full_name)}" data-dept="${escapeHTML(m.department)}" data-user-id="${m.user_id||''}">
      ${escapeHTML(m.full_name)} — ${escapeHTML(m.department)}
    </option>
  `).join('');

  showModal('🎖️ Tạo Giấy Chứng Nhận', `
    <form onsubmit="handleCreateCertSubmit(event)">
      <div style="margin-bottom:0.85rem;">
        <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:0.35rem;">Tiêu đề chứng nhận *</label>
        <input type="text" id="cert-title" required value="GIẤY CHỨNG NHẬN THÀNH TÍCH XUẤT SẮC">
      </div>
      <div style="margin-bottom:0.85rem;">
        <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:0.35rem;">Chọn thành viên nhận chứng nhận *</label>
        <select id="cert-recipient-select" required onchange="handleCertUserSelectChange(this)" style="width:100%;padding:0.6rem;border-radius:var(--radius-md);border:1px solid var(--border-light);">
          <option value="">-- Chọn thành viên nhận chứng nhận --</option>
          ${memberOptions}
        </select>
      </div>
      <input type="hidden" id="cert-recipient-name">
      <input type="hidden" id="cert-target-user-id">
      <div style="margin-bottom:0.85rem;">
        <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:0.35rem;">Ban hoạt động</label>
        <input type="text" id="cert-dept" readonly style="background:var(--bg-main);" placeholder="Tự động điền khi chọn thành viên">
      </div>
      <div style="margin-bottom:0.85rem;">
        <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:0.35rem;">Lý do cấp *</label>
        <textarea id="cert-reason" rows="3" required placeholder="Ghi nhận thành tích xuất sắc trong các hoạt động..."></textarea>
      </div>
      <div style="margin-bottom:1.25rem;">
        <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:0.35rem;">Ký bởi</label>
        <input type="text" id="cert-issuer" value="Ban Chủ nhiệm CLB Sen Trắng">
      </div>
      <button type="submit" class="btn btn-primary btn-block">🎖️ Cấp Chứng Nhận & Gửi Thông Báo</button>
    </form>
  `);
}

async function openCreateCertificateModalForUser(memberId) {
  await openCreateCertificateModal();
  const select = document.getElementById('cert-recipient-select');
  if (select) {
    select.value = memberId;
    handleCertUserSelectChange(select);
  }
}

function handleCertUserSelectChange(selectEl) {
  const selectedOpt = selectEl.options[selectEl.selectedIndex];
  if (!selectedOpt || !selectedOpt.value) {
    document.getElementById('cert-recipient-name').value = '';
    document.getElementById('cert-dept').value = '';
    document.getElementById('cert-target-user-id').value = '';
    return;
  }
  document.getElementById('cert-recipient-name').value = selectedOpt.getAttribute('data-name') || '';
  document.getElementById('cert-dept').value = selectedOpt.getAttribute('data-dept') || '';
  document.getElementById('cert-target-user-id').value = selectedOpt.getAttribute('data-user-id') || '';
}

async function handleCreateCertSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('cert-title').value;
  const memberId = document.getElementById('cert-recipient-select')?.value;
  const recipientName = document.getElementById('cert-recipient-name').value || document.getElementById('cert-recipient-select').value;
  const dept = document.getElementById('cert-dept').value;
  const reason = document.getElementById('cert-reason').value;
  const issuer = document.getElementById('cert-issuer').value;
  const targetUserId = document.getElementById('cert-target-user-id').value;

  try {
    const certPayload = {
      title: title,
      recipient_name: recipientName,
      department: dept,
      reason: reason,
      issued_by: issuer,
      user_id: targetUserId,
      member_id: memberId,
      issued_date: new Date().toLocaleDateString('vi-VN')
    };

    const res = await API.post('/certificates', certPayload);

    showToast(res.message || `Đã cấp chứng nhận thành công cho ${recipientName}!`, 'success');
    closeModal();
    if (typeof loadCertificatesList === 'function') loadCertificatesList();
    if (typeof loadOverviewCertificates === 'function') loadOverviewCertificates();
    if (typeof performSyncCheck === 'function') performSyncCheck();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

async function openPointsAdjustmentModal(memberId = null) {
  if (!isSuperAdmin() && !hasPermission('roles.manage') && !hasPermission('certificates.issue')) {
    showToast('🔒 Bạn không có quyền cộng/trừ điểm thành tích!', 'error');
    return;
  }
  let members = [];
  try {
    const res = await apiFetch('/api/members');
    members = Array.isArray(res) ? res : (res.data || []);
  } catch {}

  const memberOptions = members.map(m => `
    <option value="${m.id}" ${memberId && memberId === m.id ? 'selected' : ''}>
      ${escapeHTML(m.full_name)} — ${escapeHTML(m.department || 'CLB')} (${m.total_points || 0} ĐTT)
    </option>
  `).join('');

  showModal('⚖️ Quản Lý Điểm Thành Tích (Cộng / Trừ Điểm Vi Phạm)', `
    <form onsubmit="handlePointsAdjustmentSubmit(event)">
      <div style="margin-bottom:0.85rem;">
        <label style="display:block;font-size:0.85rem;font-weight:700;margin-bottom:0.35rem;">Chọn thành viên *</label>
        <select id="adj-member-id" required style="width:100%;padding:0.65rem;border-radius:var(--radius-md);border:1px solid var(--border-light);">
          <option value="">-- Chọn thành viên --</option>
          ${memberOptions}
        </select>
      </div>

      <div style="margin-bottom:0.85rem;">
        <label style="display:block;font-size:0.85rem;font-weight:700;margin-bottom:0.35rem;">Loại điều chỉnh *</label>
        <select id="adj-type" required style="width:100%;padding:0.65rem;border-radius:var(--radius-md);border:1px solid var(--border-light);">
          <option value="bonus">➕ Cộng điểm thưởng thành tích (+ĐTT)</option>
          <option value="penalty">➖ Trừ điểm vi phạm quy chế (-ĐTT)</option>
        </select>
      </div>

      <div style="margin-bottom:0.85rem;">
        <label style="display:block;font-size:0.85rem;font-weight:700;margin-bottom:0.35rem;">Số điểm (+ĐTT hoặc -ĐTT) *</label>
        <input type="number" id="adj-points" value="10" min="1" max="100" required style="width:100%;padding:0.65rem;border-radius:var(--radius-md);border:1px solid var(--border-light);">
      </div>

      <div style="margin-bottom:1.25rem;">
        <label style="display:block;font-size:0.85rem;font-weight:700;margin-bottom:0.35rem;">Lý do khen thưởng / vi phạm *</label>
        <textarea id="adj-reason" rows="3" required placeholder="Ví dụ: Tăng cường hỗ trợ Ban Kỹ thuật sự kiện Mùa Hè Xanh / Vi phạm thời gian sinh hoạt CLB..."></textarea>
      </div>

      <button type="submit" class="btn btn-primary btn-block">💾 Cập Nhật Điểm Thành Tích</button>
    </form>
  `);
}

async function handlePointsAdjustmentSubmit(e) {
  e.preventDefault();
  try {
    const payload = {
      member_id: document.getElementById('adj-member-id').value,
      type: document.getElementById('adj-type').value,
      points: parseFloat(document.getElementById('adj-points').value) || 0,
      reason: document.getElementById('adj-reason').value
    };
    const res = await API.post('/certificates/points-adjustment', payload);
    showToast(res.message || 'Cập nhật điểm thành tích thành công!', 'success');
    closeModal();
    loadLeaderboard();
    if (typeof loadOverviewStats === 'function') loadOverviewStats();
    if (typeof performSyncCheck === 'function') performSyncCheck();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

async function loadCertificatesList() {
  const container = document.getElementById('certificates-list-container');
  const actionsEl = document.getElementById('cert-view-action-buttons');
  if (!container) return;

  const canManage = hasPermission('certificates.issue') || isSuperAdmin();
  if (actionsEl) {
    let btns = canManage ? `<button class="btn btn-primary btn-sm" onclick="openCreateCertificateModal()">🎖️ Cấp chứng nhận mới</button>` : '';
    if (isSuperAdmin()) {
      btns += ` <button class="btn btn-danger btn-sm" onclick="openResetModuleModal('certificates')">🔄 Reset Giấy chứng nhận</button>`;
    }
    actionsEl.innerHTML = btns;
  }
  container.innerHTML = '<div class="text-center">Đang tải danh sách chứng nhận...</div>';

  try {
    const res = await apiFetch('/api/certificates');
    const certs = res.data || (Array.isArray(res) ? res : []);

    if (certs.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:2.5rem;color:var(--text-muted);">
          <div style="font-size:3rem;margin-bottom:0.5rem;">📜</div>
          <div>Chưa có giấy chứng nhận nào được cấp trong hệ thống.</div>
        </div>
      `;
      return;
    }

    const cardsHTML = certs.map(c => `
      <div style="background:linear-gradient(135deg, #FFFDF5 0%, #FFF8E7 100%);border:1.5px solid #FFD700;border-radius:var(--radius-xl);padding:1.25rem;box-shadow:0 6px 18px rgba(184,134,11,0.12);display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;position:relative;overflow:hidden;">
        <div style="display:flex;align-items:center;gap:1rem;min-width:240px;flex:1;">
          <div style="width:54px;height:54px;border-radius:50%;background:#FFF;border:2px solid #FFD700;box-shadow:0 3px 8px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <img src="assets/images/logo.png" style="width:40px;height:40px;object-fit:contain;" alt="Logo">
          </div>
          <div>
            <div style="font-weight:900;font-size:1.05rem;color:#8B0000;text-transform:uppercase;">${escapeHTML(c.title)}</div>
            <div style="font-size:0.875rem;font-weight:800;color:#1A237E;margin:0.2rem 0;">👤 ${escapeHTML(c.recipient_name)} <span style="font-size:0.775rem;font-weight:600;color:#2E7D32;">(${escapeHTML(c.department || 'Ban Hoạt động')})</span></div>
            <div style="font-size:0.8rem;color:#5D4037;font-style:italic;">"${escapeHTML(c.reason)}"</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.45rem;min-width:140px;">
          <span style="font-size:0.75rem;font-weight:800;color:#1565C0;background:rgba(21,101,192,0.1);padding:0.25rem 0.65rem;border-radius:var(--radius-full);">${escapeHTML(c.certificate_id || 'CERT-STH')}</span>
          <span style="font-size:0.75rem;color:var(--text-muted);">📅 ${escapeHTML(c.issued_date || '2026')}</span>
          <button class="btn btn-secondary btn-sm" onclick='displayCertificateModal(${JSON.stringify(c)})' style="border:1px solid #FFD700;color:#8B0000;font-weight:700;background:#FFF8E7;">📜 Xem Bằng Khen</button>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:1.25rem;">
        ${cardsHTML}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</div>`;
  }
}

function openCreateYearModal() {
  showModal('🗓️ Tạo Năm Hoạt Động Mới', `
    <form onsubmit="handleCreateYearSubmit(event)">
      <div style="margin-bottom:1.25rem;">
        <label style="display:block;font-size:0.85rem;font-weight:700;margin-bottom:0.35rem;">Nhập Năm Hoạt Động *</label>
        <input type="number" id="new-year-input" required min="2020" max="2035" value="${new Date().getFullYear() + 1}" style="width:100%;padding:0.65rem;border-radius:var(--radius-md);border:1px solid var(--border-light);">
      </div>
      <button type="submit" class="btn btn-primary btn-block">🗓️ Tạo Năm Hoạt Động</button>
    </form>
  `);
}

async function handleCreateYearSubmit(e) {
  e.preventDefault();
  const yearVal = document.getElementById('new-year-input')?.value;
  try {
    const res = await API.post('/years', { year: yearVal });
    showToast(res.message || `Đã thêm năm hoạt động ${yearVal}!`, 'success');
    selectedLeaderboardYear = yearVal.toString();
    closeModal();
    loadLeaderboard();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

window.loadLeaderboard = loadLeaderboard;
window.loadCertificatesList = loadCertificatesList;
window.issueCertificate = issueCertificate;
window.displayCertificateModal = displayCertificateModal;
window.openCreateCertificateModal = openCreateCertificateModal;
window.openCreateCertificateModalForUser = openCreateCertificateModalForUser;
window.handleCertUserSelectChange = handleCertUserSelectChange;
window.handleCreateCertSubmit = handleCreateCertSubmit;
window.openPointsAdjustmentModal = openPointsAdjustmentModal;
window.handlePointsAdjustmentSubmit = handlePointsAdjustmentSubmit;
window.changeLeaderboardYear = changeLeaderboardYear;
window.changeLeaderboardCampaign = changeLeaderboardCampaign;
window.openCreateYearModal = openCreateYearModal;
window.handleCreateYearSubmit = handleCreateYearSubmit;
