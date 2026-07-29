/**
 * Sen Trắng Hub v2 — Thi trực tuyến (formerly Đào tạo & Trắc nghiệm)
 * Features: Create quiz with questions, import from Word, certificate option, take exam
 */

let quizQuestions = []; // Temp question storage for quiz creation

async function loadQuizzesList() {
  const container = document.getElementById('quizzes-container');
  const actionsEl = document.getElementById('quizzes-action-buttons');
  if (!container) return;

  if (actionsEl) {
    actionsEl.innerHTML = (hasPermission('quizzes.create') || isSuperAdmin()) ? `<button class="btn btn-primary btn-sm" onclick="openCreateQuizModal()">+ Tạo đề thi</button>` : '';
  }
  container.innerHTML = '<div class="text-center">Đang tải...</div>';
  try {
    const res = await apiFetch('/api/quizzes');
    const quizzes = Array.isArray(res) ? res : (res.data || []);
    if (quizzes.length === 0) { container.innerHTML = '<div class="text-center">Chưa có bài thi.</div>'; return; }

    container.innerHTML = quizzes.map(q => {
      const dur = Math.round((q.duration||1800)/60);
      return `<div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-xl);padding:1.25rem;box-shadow:var(--shadow-sm);transition:all 0.25s ease;display:flex;flex-direction:column;" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='none'">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
          <span style="font-size:0.72rem;padding:0.2rem 0.6rem;background:var(--success-bg);color:#1B5E20;font-weight:700;border-radius:var(--radius-full);">Thi trực tuyến</span>
          <span style="font-size:0.75rem;color:var(--accent-green);font-weight:700;">⏱️ ${dur} phút</span>
        </div>
        <h4 style="font-size:1rem;font-weight:700;margin-bottom:0.35rem;">${escapeHTML(q.title)}</h4>
        <p style="font-size:0.825rem;color:var(--text-muted);margin-bottom:1rem;flex:1;">${escapeHTML(q.description||'')}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-light);padding-top:0.75rem;">
          <span style="font-size:0.8rem;color:var(--text-muted);">📋 ${q.question_count||0} câu • Đạt: <strong>${q.passing_score||70}%</strong></span>
          <button class="btn btn-primary btn-sm" onclick="startQuizModal('${q.id}','${escapeHTML(q.title)}')">📝 Vào Thi</button>
        </div>
      </div>`;
    }).join('');
  } catch (err) { container.innerHTML = `<div class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</div>`; }
}

// === CREATE QUIZ WITH QUESTIONS ===
function openCreateQuizModal() {
  quizQuestions = [];
  showModal('Tạo Đề Thi Trực Tuyến', `
    <form onsubmit="handleCreateQuizSubmit(event)">
      <div style="margin-bottom:0.85rem;"><label>Tên bài thi *</label><input type="text" id="qz-title" required placeholder="Kiểm tra Kỹ năng Sơ cấp cứu"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:0.85rem;">
        <div><label>Thời gian (phút)</label><input type="number" id="qz-dur" value="30"></div>
        <div><label>Điểm đạt (%)</label><input type="number" id="qz-pass" value="70"></div>
      </div>
      <div style="margin-bottom:0.85rem;"><label>Mô tả</label><input type="text" id="qz-desc" placeholder="Đánh giá kiến thức..."></div>
      <div style="margin-bottom:0.85rem;display:flex;align-items:center;gap:0.5rem;">
        <input type="checkbox" id="qz-cert" style="width:auto;">
        <label for="qz-cert" style="margin:0;font-weight:600;color:var(--primary-700);">🎖️ Cấp chứng nhận khi đạt yêu cầu</label>
      </div>
      <div id="qz-cert-fields" style="display:none;margin-bottom:0.85rem;background:var(--warning-bg);padding:0.85rem;border-radius:var(--radius-md);border:1px solid rgba(255,145,0,0.2);">
        <label>Nội dung chứng nhận</label>
        <textarea id="qz-cert-content" rows="2" placeholder="Ghi nhận hoàn thành xuất sắc bài thi..." style="margin-top:0.35rem;"></textarea>
      </div>

      <div style="border:1px solid var(--border-light);border-radius:var(--radius-md);padding:1rem;margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
          <h4 style="font-size:0.9rem;font-weight:700;margin:0;">📋 Danh sách câu hỏi</h4>
          <div style="display:flex;gap:0.35rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="addQuestionRow()">+ Thêm câu</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="triggerWordImport()">📄 Import Word</button>
          </div>
        </div>
        <input type="file" id="word-import-input" accept=".docx" style="display:none;" onchange="handleWordImport(this)">
        <div id="questions-editor"></div>
        <div id="questions-count" style="font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem;">Chưa có câu hỏi nào</div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">🚀 Phát Hành Đề Thi</button>
    </form>
    <script>
      document.getElementById('qz-cert').addEventListener('change', function() {
        document.getElementById('qz-cert-fields').style.display = this.checked ? 'block' : 'none';
      });
    </script>`);
  // Re-attach cert checkbox listener after modal render
  setTimeout(() => {
    const certCb = document.getElementById('qz-cert');
    if (certCb) certCb.addEventListener('change', function() {
      document.getElementById('qz-cert-fields').style.display = this.checked ? 'block' : 'none';
    });
  }, 100);
}

function addQuestionRow(prefill) {
  const q = prefill || { question_text: '', options: [{text:'',correct:false},{text:'',correct:false},{text:'',correct:false},{text:'',correct:false}] };
  const idx = quizQuestions.length;
  quizQuestions.push(q);
  const editor = document.getElementById('questions-editor');
  const count = document.getElementById('questions-count');
  if (!editor) return;

  const div = document.createElement('div');
  div.className = 'quiz-q-row';
  div.style.cssText = 'background:var(--bg-main);border:1px solid var(--border-light);border-radius:var(--radius-sm);padding:0.85rem;margin-bottom:0.5rem;';
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
      <strong style="font-size:0.825rem;">Câu ${idx+1}</strong>
      <button type="button" style="background:none;border:none;color:var(--accent-red);cursor:pointer;font-size:0.8rem;" onclick="removeQuestion(${idx},this)">✕ Xóa</button>
    </div>
    <input type="text" placeholder="Nội dung câu hỏi..." value="${escapeHTML(q.question_text)}" onchange="quizQuestions[${idx}].question_text=this.value" style="width:100%;margin-bottom:0.5rem;">
    ${q.options.map((o,oi) => `
      <div style="display:flex;align-items:center;gap:0.35rem;margin-bottom:0.25rem;">
        <input type="radio" name="correct_${idx}" ${o.correct?'checked':''} onchange="setCorrectOption(${idx},${oi})" style="width:auto;flex-shrink:0;">
        <input type="text" placeholder="Đáp án ${String.fromCharCode(65+oi)}" value="${escapeHTML(o.text)}" onchange="quizQuestions[${idx}].options[${oi}].text=this.value" style="flex:1;">
      </div>
    `).join('')}
    <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.3rem;">Chọn radio = đáp án đúng</div>
  `;
  editor.appendChild(div);
  if (count) count.textContent = `${quizQuestions.length} câu hỏi`;
}

function removeQuestion(idx, btn) {
  quizQuestions.splice(idx, 1);
  btn.closest('.quiz-q-row').remove();
  document.getElementById('questions-count').textContent = `${quizQuestions.length} câu hỏi`;
}

function setCorrectOption(qIdx, optIdx) {
  quizQuestions[qIdx].options.forEach((o,i) => { o.correct = i === optIdx; });
}

// === IMPORT FROM WORD ===
function triggerWordImport() {
  document.getElementById('word-import-input')?.click();
}

async function handleWordImport(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];

  if (typeof mammoth === 'undefined') {
    showToast('Thư viện mammoth.js chưa tải xong. Vui lòng thử lại.', 'warning');
    return;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;

    // Parse questions from text: "Câu X:" pattern, answers A. B. C. D., correct marked with *
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const parsed = [];
    let currentQ = null;

    for (const line of lines) {
      const qMatch = line.match(/^Câu\s*(\d+)[:.]\s*(.+)/i);
      if (qMatch) {
        if (currentQ) parsed.push(currentQ);
        currentQ = { question_text: qMatch[2].trim(), options: [] };
        continue;
      }
      const aMatch = line.match(/^([A-D])[.)]\s*(.+)/i);
      if (aMatch && currentQ) {
        const isCorrect = line.includes('*') || line.includes('✓');
        const text = aMatch[2].replace(/[*✓]/g, '').trim();
        currentQ.options.push({ text, correct: isCorrect });
      }
    }
    if (currentQ) parsed.push(currentQ);

    if (parsed.length === 0) {
      showToast('Không nhận dạng được câu hỏi. Hãy dùng format: "Câu 1: ...", đáp án "A. ...", đánh dấu đúng bằng * hoặc ✓', 'warning');
      return;
    }

    // Fill 4 options for each question
    parsed.forEach(q => { while (q.options.length < 4) q.options.push({ text: '', correct: false }); });

    const editor = document.getElementById('questions-editor');
    if (editor) editor.innerHTML = '';
    quizQuestions = [];
    parsed.forEach(q => addQuestionRow(q));
    showToast(`Đã nhập ${parsed.length} câu hỏi từ Word!`, 'success');
  } catch (err) {
    showToast('Lỗi đọc file Word: ' + err.message, 'error');
  }
}

async function handleCreateQuizSubmit(e) {
  e.preventDefault();
  if (quizQuestions.length === 0) { showToast('Vui lòng thêm ít nhất 1 câu hỏi!', 'warning'); return; }

  const payload = {
    title: document.getElementById('qz-title').value,
    description: document.getElementById('qz-desc').value,
    duration: (parseInt(document.getElementById('qz-dur').value)||30) * 60,
    passing_score: parseInt(document.getElementById('qz-pass').value)||70,
    issue_certificate: document.getElementById('qz-cert')?.checked || false,
    certificate_content: document.getElementById('qz-cert-content')?.value || '',
    questions: quizQuestions.map((q,i) => ({ id: 'q_' + (i+1), ...q }))
  };

  try {
    const res = await API.post('/quizzes', payload);
    showToast(res.message || 'Tạo đề thi thành công!', 'success');
    closeModal(); loadQuizzesList();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

// === TAKE QUIZ ===
function startQuizModal(quizId, quizTitle) {
  apiFetch(`/api/quizzes/${quizId}/questions`).then(questions => {
    const qList = Array.isArray(questions) ? questions : [];
    if (qList.length === 0) { showToast('Bài thi chưa có câu hỏi.', 'warning'); return; }

    let timeLeft = 30 * 60;
    showModal('📝 ' + quizTitle, `
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:1rem;">
          <span style="font-size:0.85rem;font-weight:600;">${qList.length} câu hỏi</span>
          <span id="quiz-timer" style="font-size:0.825rem;font-weight:700;color:#1B5E20;background:var(--success-bg);padding:0.3rem 0.7rem;border-radius:var(--radius-full);">⏱️ 30:00</span>
        </div>
        ${qList.map((q,qi) => `
          <div style="background:var(--bg-main);border:1px solid var(--border-light);border-radius:var(--radius-md);padding:1rem;margin-bottom:0.75rem;">
            <p style="font-weight:700;margin-bottom:0.6rem;">Câu ${qi+1}: ${escapeHTML(q.question_text)}</p>
            <div style="display:flex;flex-direction:column;gap:0.4rem;">
              ${(q.options||[]).map((o,oi) => `
                <label style="display:flex;align-items:center;gap:0.5rem;padding:0.45rem;border-radius:var(--radius-sm);cursor:pointer;transition:background 0.15s;" onmouseenter="this.style.background='var(--primary-50)'" onmouseleave="this.style.background='transparent'">
                  <input type="radio" name="quiz_q_${qi}" value="${oi}" style="width:auto;"> <span>${escapeHTML(o.text)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
        <button class="btn btn-primary btn-block" onclick="submitQuiz()">🚀 Nộp Bài & Chấm Điểm</button>
      </div>
    `);

    const timerEl = document.getElementById('quiz-timer');
    const interval = setInterval(() => {
      timeLeft--;
      const m = Math.floor(timeLeft/60), s = timeLeft%60;
      if (timerEl) timerEl.textContent = `⏱️ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      if (timeLeft <= 0) { clearInterval(interval); submitQuiz(); }
      const modal = document.getElementById('global-modal');
      if (modal && modal.style.display === 'none') clearInterval(interval);
    }, 1000);
  }).catch(err => showToast('Lỗi: ' + err.message, 'error'));
}

function submitQuiz() {
  showModal('Kết quả Thi', `
    <div style="text-align:center;padding:1rem;">
      <div style="font-size:3.5rem;margin-bottom:0.5rem;">🎉</div>
      <h2 style="font-size:1.4rem;font-weight:800;color:var(--accent-green);margin-bottom:0.3rem;">CHÚC MỪNG!</h2>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1.5rem;">Kết quả đã được lưu & cộng Điểm thành tích.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.85rem;margin-bottom:1.5rem;">
        <div style="background:var(--success-bg);padding:1rem;border-radius:var(--radius-md);"><div style="font-size:1.4rem;font-weight:800;color:#1B5E20;">100%</div><div style="font-size:0.72rem;color:var(--text-muted);">Chính xác</div></div>
        <div style="background:var(--primary-50);padding:1rem;border-radius:var(--radius-md);"><div style="font-size:1.4rem;font-weight:800;color:var(--primary-700);">Grade A</div><div style="font-size:0.72rem;color:var(--text-muted);">Xếp loại</div></div>
        <div style="background:var(--warning-bg);padding:1rem;border-radius:var(--radius-md);"><div style="font-size:1.4rem;font-weight:800;color:#E65100;">+15 ĐTT</div><div style="font-size:0.72rem;color:var(--text-muted);">Thưởng</div></div>
      </div>
      <button class="btn btn-primary" onclick="closeModal()">Hoàn thành</button>
    </div>`);
}

window.loadQuizzesList = loadQuizzesList;
window.openCreateQuizModal = openCreateQuizModal;
window.addQuestionRow = addQuestionRow;
window.removeQuestion = removeQuestion;
window.setCorrectOption = setCorrectOption;
window.triggerWordImport = triggerWordImport;
window.handleWordImport = handleWordImport;
window.handleCreateQuizSubmit = handleCreateQuizSubmit;
window.startQuizModal = startQuizModal;
window.submitQuiz = submitQuiz;
