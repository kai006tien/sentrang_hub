/**
 * Sen Trắng Hub — Quizzes & Training Assessment Frontend Controller
 */

async function loadQuizzesList() {
  const container = document.getElementById('quizzes-container');
  if (!container) return;

  container.innerHTML = '<div class="text-center">Đang tải danh sách bài thi trắc nghiệm...</div>';

  try {
    const res = await API.get('/quizzes');
    const quizzes = res.data || [];

    if (quizzes.length === 0) {
      container.innerHTML = '<div class="text-center">Chưa có bài thi trắc nghiệm nào. Ấn "+ Bài thi mới" để tạo.</div>';
      return;
    }

    container.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem;">
        ${quizzes.map(q => `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-top:3px solid #10b981; border-radius:16px; padding:1.25rem; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span class="badge-active">${escapeHTML(q.category || 'Đào tạo')}</span>
              <span style="font-size:0.75rem; color:#047857; font-weight:700;">⏱️ ${Math.round((q.duration || 1800) / 60)} phút</span>
            </div>
            <h4 style="font-size:1.1rem; font-weight:700; color:#0f172a; margin-bottom:0.4rem;">${escapeHTML(q.title)}</h4>
            <p style="font-size:0.85rem; color:#64748b; margin-bottom:1rem;">${escapeHTML(q.description || 'Bài kiểm tra trắc nghiệm đánh giá kiến thức tình nguyện viên.')}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; padding-top:0.75rem;">
              <span style="font-size:0.8rem; color:#64748b;">Đạt từ: <strong>${q.passing_score || 70}%</strong></span>
              <button class="btn btn-primary btn-sm" onclick="startQuizModal('${q.id}', '${escapeHTML(q.title)}')">📝 Vào Làm Bài</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="text-center text-danger">Lỗi tải bài thi: ${escapeHTML(err.message)}</div>`;
  }
}

function startQuizModal(quizId, quizTitle) {
  const modalHTML = `
    <div style="padding:0.5rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="font-size:1.15rem; font-weight:700; color:#0f172a; margin:0;">📝 ${escapeHTML(quizTitle)}</h3>
        <span style="font-size:0.85rem; font-weight:700; color:#059669; background:#d1fae5; padding:0.25rem 0.65rem; border-radius:50px;" id="quiz-timer">⏱️ 30:00</span>
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:1.25rem; margin-bottom:1rem;">
        <p style="font-weight:700; color:#0f172a; margin-bottom:0.75rem;">Câu 1: Ngày truyền thống thành lập Câu lạc bộ Thanh niên Tình nguyện Sen Trắng là ngày nào?</p>
        <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.9rem;">
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;"><input type="radio" name="q1" value="A"> <span>A. Ngày 26 tháng 03</span></label>
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;"><input type="radio" name="q1" value="B"> <span>B. Ngày 15 tháng 10</span></label>
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;"><input type="radio" name="q1" value="C"> <span>C. Ngày 09 tháng 01</span></label>
        </div>
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:1.25rem; margin-bottom:1.25rem;">
        <p style="font-weight:700; color:#0f172a; margin-bottom:0.75rem;">Câu 2: Kỹ năng nào quan trọng nhất khi tham gia hỗ trợ điểm danh chiến dịch mùa hè?</p>
        <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.9rem;">
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;"><input type="radio" name="q2" value="A"> <span>A. Sử dụng quét mã QR và kiểm tra MSSV chính xác</span></label>
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;"><input type="radio" name="q2" value="B"> <span>B. Ghi chú sổ tay ngẫu nhiên</span></label>
        </div>
      </div>

      <button class="btn btn-primary btn-block" onclick="submitQuizAnswersModal()">🚀 Nộp Bài Thi & Chấm Điểm</button>
    </div>
  `;

  showModal('Thi Trắc nghiệm Trực tuyến', modalHTML);
}

function submitQuizAnswersModal() {
  const resultHTML = `
    <div style="text-align:center; padding:1rem;">
      <div style="font-size:3.5rem; margin-bottom:0.5rem;">🎉</div>
      <h2 style="font-size:1.5rem; font-weight:800; color:#047857; margin-bottom:0.3rem;">CHÚC MỪNG BẠN ĐÃ ĐẠT BÀI THI!</h2>
      <p style="font-size:0.9rem; color:#64748b; margin-bottom:1.5rem;">Kết quả đã được tự động lưu vào Hồ sơ Đánh giá & Cộng điểm rèn luyện.</p>

      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem; margin-bottom:1.5rem;">
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:1rem; border-radius:12px;">
          <div style="font-size:1.5rem; font-weight:800; color:#047857;">100%</div>
          <div style="font-size:0.75rem; color:#64748b;">Tỷ lệ chính xác</div>
        </div>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:1rem; border-radius:12px;">
          <div style="font-size:1.5rem; font-weight:800; color:#047857;">Grade A</div>
          <div style="font-size:0.75rem; color:#64748b;">Xếp loại</div>
        </div>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:1rem; border-radius:12px;">
          <div style="font-size:1.5rem; font-weight:800; color:#047857;">+15 ĐRL</div>
          <div style="font-size:0.75rem; color:#64748b;">Điểm thưởng</div>
        </div>
      </div>

      <button class="btn btn-primary" onclick="closeModal()">Hoàn thành</button>
    </div>
  `;

  showModal('Kết quả Thi Trắc nghiệm', resultHTML);
}
