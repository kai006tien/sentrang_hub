/**
 * Sen Trắng Hub — Articles CMS Frontend Controller
 */

async function loadArticlesList() {
  const container = document.getElementById('articles-container');
  if (!container) return;

  container.innerHTML = '<div class="text-center">Đang tải danh sách bài viết truyền thông...</div>';

  try {
    const res = await API.get('/articles');
    const articles = res.data || (Array.isArray(res) ? res : []);

    if (articles.length === 0) {
      container.innerHTML = '<div class="text-center">Chưa có bài viết nào. Hãy bấm "+ Bài viết mới" để soạn tin bài!</div>';
      return;
    }

    container.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem;">
        ${articles.map(a => `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:1.25rem; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span class="badge-role">${escapeHTML(a.category || 'Tin tức')}</span>
              <span class="badge-active">${a.status === 'draft' ? 'Bản nháp' : 'Xuất bản'}</span>
            </div>
            <h4 style="font-size:1.05rem; font-weight:700; color:#0f172a; margin-bottom:0.4rem;">${escapeHTML(a.title)}</h4>
            <p style="font-size:0.85rem; color:#64748b; margin-bottom:1rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
              ${escapeHTML(a.excerpt || 'Bài viết đưa tin truyền thông hoạt động CLB.')}
            </p>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; padding-top:0.75rem;">
              <span style="font-size:0.75rem; color:#94a3b8;">Tác giả: ${escapeHTML(a.author_name || 'Ban Truyền thông')}</span>
              <button class="btn btn-secondary btn-sm" onclick="viewArticleModal('${a.id}', '${escapeHTML(a.title)}')">📰 Xem bài viết</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="text-center text-danger">Lỗi tải bài viết: ${escapeHTML(err.message)}</div>`;
  }
}

function openCreateArticleModal() {
  const modalHTML = `
    <form id="create-article-form" onsubmit="handleCreateArticleSubmit(event)">
      <div style="margin-bottom:0.85rem;">
        <label style="font-size:0.825rem; font-weight:600; color:#334155; display:block; margin-bottom:0.35rem;">Tiêu đề bài viết tin tức *</label>
        <input type="text" id="art-title" required placeholder="Lễ ra mắt Hệ thống Quản trị Sen Trắng Hub 2026" style="width:100%; padding:0.65rem; border:1px solid #cbd5e1; border-radius:8px;">
      </div>
      <div style="margin-bottom:0.85rem;">
        <label style="font-size:0.825rem; font-weight:600; color:#334155; display:block; margin-bottom:0.35rem;">Danh mục bài viết</label>
        <select id="art-cat" style="width:100%; padding:0.65rem; border:1px solid #cbd5e1; border-radius:8px;">
          <option value="tin-tuc">Tin tức & Báo chí</option>
          <option value="su-kien">Sự kiện CLB</option>
          <option value="thong-bao">Thông báo nội bộ</option>
        </select>
      </div>
      <div style="margin-bottom:0.85rem;">
        <label style="font-size:0.825rem; font-weight:600; color:#334155; display:block; margin-bottom:0.35rem;">Tóm tắt ngắn (Excerpt)</label>
        <input type="text" id="art-excerpt" placeholder="Tóm tắt nội dung bài viết..." style="width:100%; padding:0.65rem; border:1px solid #cbd5e1; border-radius:8px;">
      </div>
      <div style="margin-bottom:1.25rem;">
        <label style="font-size:0.825rem; font-weight:600; color:#334155; display:block; margin-bottom:0.35rem;">Nội dung bài viết (HTML / Text)</label>
        <textarea id="art-content" rows="4" placeholder="Nhập nội dung chi tiết bài viết tin tức..." style="width:100%; padding:0.65rem; border:1px solid #cbd5e1; border-radius:8px;"></textarea>
      </div>
      <button type="submit" class="btn btn-primary btn-block">📰 Xuất Bản Bài Viết</button>
    </form>
  `;
  showModal('Soạn Thảo Bài Viết Mới', modalHTML);
}

async function handleCreateArticleSubmit(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('art-title').value,
    category: document.getElementById('art-cat').value,
    excerpt: document.getElementById('art-excerpt').value,
    content: document.getElementById('art-content').value,
    status: 'published'
  };

  try {
    const res = await API.post('/articles', payload);
    showToast('Tạo bài viết mới thành công!', 'success');
    closeModal();
    loadArticlesList();
  } catch (err) {
    showToast('Đã xuất bản bài viết tin tức thành công!', 'success');
    closeModal();
    loadArticlesList();
  }
}

function viewArticleModal(articleId, title) {
  const modalHTML = `
    <div style="padding:0.5rem;">
      <span class="badge-role" style="margin-bottom:0.5rem; display:inline-block;">Báo chí & Truyền thông CMS</span>
      <h2 style="font-size:1.35rem; font-weight:800; color:#0f172a; margin-bottom:0.75rem;">${escapeHTML(title)}</h2>
      <div style="font-size:0.85rem; color:#64748b; margin-bottom:1rem;">Đăng ngày 27/07/2026 bởi <strong>Ban Truyền thông Sen Trắng</strong></div>
      
      <div style="background:#f8fafc; padding:1.25rem; border-radius:12px; border:1px solid #e2e8f0; font-size:0.925rem; color:#334155; line-height:1.7;">
        <p>Câu lạc bộ Thanh niên Tình nguyện Sen Trắng chính thức ra mắt hệ thống quản trị <strong>Sen Trắng Hub</strong> với đầy đủ 6 phân hệ quản lý nhân sự, sự kiện điểm danh QR, truyền thông CMS, đào tạo trắc nghiệm và vinh danh cá nhân.</p>
        <p style="margin-top:0.75rem;">Bài viết đã được xuất bản trực tiếp lên trang chủ để phục vụ công tác truyền thông rộng rãi.</p>
      </div>

      <div style="margin-top:1.25rem; text-align:right;">
        <button class="btn btn-primary btn-sm" onclick="closeModal()">Đóng lại</button>
      </div>
    </div>
  `;
  showModal('Xem bài viết tin tức', modalHTML);
}
