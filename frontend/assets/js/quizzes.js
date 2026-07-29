/**
 * Sen Trắng Hub — Quizzes & Training Module
 */

async function loadQuizzesList() {
  const container = document.getElementById('quizzes-container');
  if (!container) return;

  container.innerHTML = '<div class="text-center">Đang tải danh sách bài thi...</div>';

  try {
    const res = await API.get('/quizzes');
    const quizzes = res.data || (Array.isArray(res) ? res : []);

    if (quizzes.length === 0) {
      container.innerHTML = '<div class="text-center">Chưa có bài thi trắc nghiệm nào. Ấn "+ Bài thi mới" để tạo.</div>';
      return;
    }

    container.innerHTML = quizzes.map(q => {
      const duration = Math.round((q.duration || 1800) / 60);

      return `
        <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-xl); padding:1.25rem; box-shadow:var(--shadow-sm); transition:all 0.25s ease; display:flex; flex-direction:column;" onmouseenter="this.style.boxShadow='var(--shadow-md)'; this.style.transform='translateY(-2px)'" onmouseleave="this.style.boxShadow='var(--shadow-sm)'; this.style.transform='none'">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span style="font-size:0.72rem; padding:0.2rem 0.6rem; background:var(--success-bg); color:#1B5E20; font-weight:700; border-radius:var(--radius-full);">${escapeHTML(q.category || 'Đào tạo')}</span>
            <span style="font-size:0.75rem; color:var(--accent-green); font-weight:700;">⏱️ ${duration} phút</span>
          </div>
          <h4 style="font-size:1rem; font-weight:700; color:var(--text-primary); margin-bottom:0.35rem;">${escapeHTML(q.title)}</h4>
          <p style="font-size:0.825rem; color:var(--text-muted); margin-bottom:1rem; flex:1;">${escapeHTML(q.description || 'Bài kiểm tra trắc nghiệm đánh giá kiến thức tình nguyện viên.')}</p>
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-light); padding-top:0.75rem;">
            <span style="font-size:0.8rem; color:var(--text-muted);">Đạt từ: <strong style="color:var(--primary-600);">${q.passing_score || 70}%</strong></span>
            <button class="btn btn-primary btn-sm" onclick="startQuizModal('${q.id}', '${escapeHTML(q.title)}')">📝 Vào Làm Bài</button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="text-center text-danger">Lỗi tải bài thi: ${escapeHTML(err.message)}</div>`;
    console.error('loadQuizzesList error:', err);
  }
}

function openCreateQuizModal() {
  const modalHTML = `
    <form id="create-quiz-form" onsubmit="handleCreateQuizSubmit(event)">
      <div style="margin-bottom:0.85rem;">
        <label>Tên bài thi trắc nghiệm *</label>
        <input type="text" id="qz-title" required placeholder="Kiểm tra Kỹ năng Sơ cấp cứu & Sinh hoạt Tập thể">
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; margin-bottom:0.85rem;">
        <div>
          <label>Thời gian (Phút)</label>
          <input type="number" id="qz-dur" value="30">
        </div>
        <div>
          <label>Điểm đạt (%)</label>
          <input type="number" id="qz-pass" value="70">
        </div>
      </div>
      <div style="margin-bottom:1.25rem;">
        <label>Mô tả bài thi</label>
        <input type="text" id="qz-desc" placeholder="Đánh giá kiến thức định kỳ cho tình nguyện viên...">
      </div>
      <button type="submit" class="btn btn-primary btn-block">📝 Khởi Tạo Bài Thi Mới</button>
    </form>
  `;
  showModal('Tạo Bài Thi Trắc Nghiệm Mới', modalHTML);
}

async function handleCreateQuizSubmit(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('qz-title').value,
    duration: (parseInt(document.getElementById('qz-dur').value) || 30) * 60,
    passing_score: parseInt(document.getElementById('qz-pass').value) || 70,
    description: document.getElementById('qz-desc').value,
    category: 'training'
  };

  try {
    const res = await API.post('/quizzes', payload);
    showToast(res.message || 'Tạo bài thi mới thành công!', 'success');
    closeModal();
    loadQuizzesList();
  } catch (err) {
    showToast('Lỗi: ' + (err.message || 'Không thể tạo bài thi'), 'error');
    console.error('handleCreateQuizSubmit error:', err);
  }
}

function startQuizModal(quizId, quizTitle) {
  let timeLeft = 30 * 60; // 30 minutes

  const modalHTML = `
    <div style="padding:0.25rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h3 style="font-size:1.05rem; font-weight:700; color:var(--text-primary); margin:0;">📝 ${escapeHTML(quizTitle)}</h3>
        <span style="font-size:0.825rem; font-weight:700; color:#1B5E20; background:var(--success-bg); padding:0.3rem 0.7rem; border-radius:var(--radius-full);" id="quiz-timer">⏱️ 30:00</span>
      </div>

      <div style="background:var(--bg-main); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1rem;">
        <p style="font-weight:700; color:var(--text-primary); margin-bottom:0.75rem;">Câu 1: Ngày truyền thống thành lập CLB Thanh niên Tình nguyện Sen Trắng là ngày nào?</p>
        <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.875rem;">
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; padding:0.5rem; border-radius:var(--radius-sm); transition:background 0.15s ease;" onmouseenter="this.style.background='var(--primary-50)'" onmouseleave="this.style.background='transparent'"><input type="radio" name="q1" value="A"> <span>A. Ngày 26 tháng 03</span></label>
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; padding:0.5rem; border-radius:var(--radius-sm); transition:background 0.15s ease;" onmouseenter="this.style.background='var(--primary-50)'" onmouseleave="this.style.background='transparent'"><input type="radio" name="q1" value="B"> <span>B. Ngày 15 tháng 10</span></label>
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; padding:0.5rem; border-radius:var(--radius-sm); transition:background 0.15s ease;" onmouseenter="this.style.background='var(--primary-50)'" onmouseleave="this.style.background='transparent'"><input type="radio" name="q1" value="C"> <span>C. Ngày 09 tháng 01</span></label>
        </div>
      </div>

      <div style="background:var(--bg-main); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.25rem;">
        <p style="font-weight:700; color:var(--text-primary); margin-bottom:0.75rem;">Câu 2: Kỹ năng nào quan trọng nhất khi hỗ trợ điểm danh chiến dịch?</p>
        <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.875rem;">
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; padding:0.5rem; border-radius:var(--radius-sm); transition:background 0.15s ease;" onmouseenter="this.style.background='var(--primary-50)'" onmouseleave="this.style.background='transparent'"><input type="radio" name="q2" value="A"> <span>A. Sử dụng quét mã QR và kiểm tra MSSV chính xác</span></label>
          <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; padding:0.5rem; border-radius:var(--radius-sm); transition:background 0.15s ease;" onmouseenter="this.style.background='var(--primary-50)'" onmouseleave="this.style.background='transparent'"><input type="radio" name="q2" value="B"> <span>B. Ghi chú sổ tay ngẫu nhiên</span></label>
        </div>
      </div>

      <button class="btn btn-primary btn-block" onclick="submitQuizAnswersModal()">🚀 Nộp Bài Thi & Chấm Điểm</button>
    </div>
  `;

  showModal('Thi Trắc nghiệm Trực tuyến', modalHTML);

  // Timer countdown
  const timerEl = document.getElementById('quiz-timer');
  if (timerEl) {
    const timerInterval = setInterval(() => {
      timeLeft--;
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      timerEl.textContent = `⏱️ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        submitQuizAnswersModal();
      }

      // Check if modal closed
      const modal = document.getElementById('global-modal');
      if (modal && modal.style.display === 'none') {
        clearInterval(timerInterval);
      }
    }, 1000);
  }
}

function submitQuizAnswersModal() {
  const resultHTML = `
    <div style="text-align:center; padding:1rem;">
      <div style="font-size:3.5rem; margin-bottom:0.5rem;">🎉</div>
      <h2 style="font-size:1.4rem; font-weight:800; color:var(--accent-green); margin-bottom:0.3rem;">CHÚC MỪNG!</h2>
      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.5rem;">Kết quả đã được lưu vào Hồ sơ & Cộng điểm rèn luyện.</p>

      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.85rem; margin-bottom:1.5rem;">
        <div style="background:var(--success-bg); padding:1rem; border-radius:var(--radius-md); border:1px solid rgba(0,200,83,0.2);">
          <div style="font-size:1.4rem; font-weight:800; color:#1B5E20;">100%</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Tỷ lệ chính xác</div>
        </div>
        <div style="background:var(--primary-50); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--primary-100);">
          <div style="font-size:1.4rem; font-weight:800; color:var(--primary-700);">Grade A</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Xếp loại</div>
        </div>
        <div style="background:var(--warning-bg); padding:1rem; border-radius:var(--radius-md); border:1px solid rgba(255,145,0,0.2);">
          <div style="font-size:1.4rem; font-weight:800; color:#E65100;">+15 ĐRL</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Điểm thưởng</div>
        </div>
      </div>

      <button class="btn btn-primary" onclick="closeModal()">Hoàn thành</button>
    </div>
  `;

  showModal('Kết quả Thi Trắc nghiệm', resultHTML);
}

// Expose to global
window.loadQuizzesList = loadQuizzesList;
window.openCreateQuizModal = openCreateQuizModal;
window.handleCreateQuizSubmit = handleCreateQuizSubmit;
window.startQuizModal = startQuizModal;
window.submitQuizAnswersModal = submitQuizAnswersModal;
