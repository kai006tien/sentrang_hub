/**
 * Sen Trắng Hub — Quizzes & Training Assessment Frontend Controller
 */

let activeQuiz = null;
let activeAttemptId = null;
let quizQuestions = [];
let quizTimerInterval = null;
let quizTimeRemaining = 0;

async function loadQuizzesList() {
  const container = document.getElementById('quizzes-cards-container');
  if (!container) return;

  container.innerHTML = '<p style="color: var(--text-dim);">Đang tải bài thi trắc nghiệm...</p>';

  try {
    const quizzes = await apiFetch('/api/quizzes');

    if (quizzes.length === 0) {
      container.innerHTML = '<p style="color: var(--text-dim);">Chưa có bài thi nào. Ấn "Tạo bài thi mới" để bắt đầu.</p>';
      return;
    }

    container.innerHTML = quizzes.map(q => `
      <div class="card-box" style="margin-bottom: 0;">
        <div class="card-header">
          <span class="badge badge-truong_ban">${q.category}</span>
          <span style="font-size: 0.75rem; color: var(--gold-400); font-weight: 700;">⏱️ ${Math.round(q.duration / 60)} phút</span>
        </div>
        <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">${q.title}</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${q.description || 'Bài kiểm tra đánh giá kiến thức tình nguyện viên.'}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.8rem; color: var(--text-dim);">Đạt từ: <strong>${q.passing_score}%</strong></span>
          <button class="btn-sm btn-primary" style="width: auto;" onclick="startQuizPlayer('${q.id}')">📝 Vào Thi</button>
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<p style="color: var(--accent-red);">Lỗi: ${err.message}</p>`;
  }
}

async function startQuizPlayer(quizId) {
  try {
    // 1. Khởi tạo lượt thi
    const attempt = await apiFetch(`/api/quizzes/${quizId}/start`, { method: 'POST' });
    activeAttemptId = attempt.attempt_id;
    quizTimeRemaining = attempt.duration || 1800;

    // 2. Lấy câu hỏi
    const questions = await apiFetch(`/api/quizzes/${quizId}/questions?for_take=true`);
    quizQuestions = questions;

    if (quizQuestions.length === 0) {
      showToast('Bài thi chưa có câu hỏi nào trong ngân hàng đề!', 'error');
      return;
    }

    // 3. Hiển thị Modal Quiz Player
    renderQuizPlayerModal();

  } catch (err) {
    showToast(err.message || 'Không thể bắt đầu bài thi', 'error');
  }
}

function renderQuizPlayerModal() {
  const modal = document.getElementById('modal-quiz-player');
  const body = document.getElementById('quiz-player-body');
  if (!modal || !body) return;

  modal.classList.add('active');

  // Khởi động đồng hồ đếm ngược
  startCountdownTimer();

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <div style="font-size: 1.1rem; font-weight: 800; color: var(--gold-400);" id="quiz-timer-display">⏱️ 00:00</div>
      <div style="font-size: 0.85rem; color: var(--text-muted);">${quizQuestions.length} câu hỏi</div>
    </div>

    <form id="quiz-player-form">
      ${quizQuestions.map((q, idx) => `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem;">
          <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.75rem;">
            Câu ${idx + 1}: ${q.question_text}
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${(q.options || []).map(opt => `
              <label style="display: flex; align-items: center; gap: 0.65rem; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.875rem;">
                <input type="radio" name="q_${q.id}" value="${opt.id}" style="accent-color: var(--primary-500);">
                <span>${opt.text}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `).join('')}

      <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
        <button type="button" class="btn-sm btn-primary" style="width: auto; padding: 0.75rem 2rem;" onclick="submitQuizAnswers()">🚀 Nộp Bài Thi</button>
      </div>
    </form>
  `;
}

function startCountdownTimer() {
  if (quizTimerInterval) clearInterval(quizTimerInterval);

  quizTimerInterval = setInterval(() => {
    quizTimeRemaining--;

    const minutes = Math.floor(quizTimeRemaining / 60);
    const seconds = quizTimeRemaining % 60;
    const timerDisplay = document.getElementById('quiz-timer-display');

    if (timerDisplay) {
      timerDisplay.textContent = `⏱️ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    if (quizTimeRemaining <= 0) {
      clearInterval(quizTimerInterval);
      showToast('Hết giờ làm bài! Hệ thống tự động nộp bài.', 'error');
      submitQuizAnswers();
    }
  }, 1000);
}

async function submitQuizAnswers() {
  if (quizTimerInterval) clearInterval(quizTimerInterval);

  const answers = quizQuestions.map(q => {
    const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
    return {
      question_id: q.id,
      selected_options: selected ? [selected.value] : []
    };
  });

  try {
    const res = await apiFetch(`/api/quizzes/attempts/${activeAttemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });

    // Render thẻ kết quả
    const body = document.getElementById('quiz-player-body');
    const badgeColor = res.passed ? 'var(--primary-400)' : 'var(--accent-red)';

    body.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">${res.passed ? '🎉' : '💔'}</div>
        <h3 style="font-size: 1.5rem; font-weight: 800; color: ${badgeColor};">${res.message}</h3>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 2rem 0;">
          <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: var(--radius-md);">
            <div style="font-size: 1.5rem; font-weight: 800;">${res.score_percent}%</div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">Điểm phần trăm</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: var(--radius-md);">
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--gold-400);">${res.grade}</div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">Xếp loại Grade</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: var(--radius-md);">
            <div style="font-size: 1.5rem; font-weight: 800;">${res.correct_count}/${quizQuestions.length}</div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">Số câu đúng</div>
          </div>
        </div>

        <button class="btn-sm btn-primary" style="width: auto;" onclick="closeModal('modal-quiz-player')">Hoàn thành</button>
      </div>
    `;

  } catch (err) {
    showToast(err.message || 'Nộp bài thất bại', 'error');
  }
}

window.loadQuizzesList = loadQuizzesList;
window.startQuizPlayer = startQuizPlayer;
window.submitQuizAnswers = submitQuizAnswers;
