/**
 * Sen Trắng Hub — Articles CMS Module
 */

async function loadArticlesList() {
  const container = document.getElementById('articles-container');
  if (!container) return;

  container.innerHTML = '<div class="text-center">Đang tải danh sách bài viết...</div>';

  try {
    const res = await API.get('/articles');
    const articles = res.data || (Array.isArray(res) ? res : []);

    if (articles.length === 0) {
      container.innerHTML = '<div class="text-center">Chưa có bài viết nào. Hãy bấm "+ Bài viết mới" để soạn tin bài!</div>';
      return;
    }

    const categoryLabels = {
      'tin-tuc': { label: 'Tin tức', bg: '#E3F2FD', text: '#0D47A1' },
      'su-kien': { label: 'Sự kiện', bg: '#FFF3E0', text: '#E65100' },
      'thong-bao': { label: 'Thông báo', bg: '#F3E5F5', text: '#6A1B9A' }
    };

    container.innerHTML = articles.map(a => {
      const cat = categoryLabels[a.category] || { label: a.category || 'Tin tức', bg: '#E3F2FD', text: '#0D47A1' };
      const statusColor = a.status === 'draft' ? { bg: '#FFF3E0', text: '#E65100', label: 'Bản nháp' } : { bg: '#E8F5E9', text: '#1B5E20', label: 'Xuất bản' };

      return `
        <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-xl); padding:1.25rem; box-shadow:var(--shadow-sm); transition:all 0.25s ease; display:flex; flex-direction:column;" onmouseenter="this.style.boxShadow='var(--shadow-md)'; this.style.transform='translateY(-2px)'" onmouseleave="this.style.boxShadow='var(--shadow-sm)'; this.style.transform='none'">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span style="font-size:0.72rem; padding:0.2rem 0.6rem; background:${cat.bg}; color:${cat.text}; font-weight:700; border-radius:var(--radius-full);">${cat.label}</span>
            <span style="font-size:0.72rem; padding:0.2rem 0.6rem; background:${statusColor.bg}; color:${statusColor.text}; font-weight:700; border-radius:var(--radius-full);">${statusColor.label}</span>
          </div>
          <h4 style="font-size:1rem; font-weight:700; color:var(--text-primary); margin-bottom:0.35rem;">${escapeHTML(a.title)}</h4>
          <p style="font-size:0.825rem; color:var(--text-muted); margin-bottom:1rem; flex:1; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            ${escapeHTML(a.excerpt || 'Bài viết đưa tin truyền thông hoạt động CLB.')}
          </p>
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-light); padding-top:0.75rem;">
            <span style="font-size:0.72rem; color:var(--text-muted);">✍️ ${escapeHTML(a.author_name || 'Ban Truyền thông')}</span>
            <button class="btn btn-secondary btn-sm" onclick="viewArticleModal('${a.id}', '${escapeHTML(a.title)}')">📰 Xem</button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="text-center text-danger">Lỗi tải bài viết: ${escapeHTML(err.message)}</div>`;
    console.error('loadArticlesList error:', err);
  }
}

function openCreateArticleModal() {
  const modalHTML = `
    <form id="create-article-form" onsubmit="handleCreateArticleSubmit(event)">
      <div style="margin-bottom:0.85rem;">
        <label>Tiêu đề bài viết *</label>
        <input type="text" id="art-title" required placeholder="Lễ ra mắt Hệ thống Quản trị Sen Trắng Hub 2026">
      </div>
      <div style="margin-bottom:0.85rem;">
        <label>Danh mục bài viết</label>
        <select id="art-cat">
          <option value="tin-tuc">Tin tức & Báo chí</option>
          <option value="su-kien">Sự kiện CLB</option>
          <option value="thong-bao">Thông báo nội bộ</option>
        </select>
      </div>
      <div style="margin-bottom:0.85rem;">
        <label>Tóm tắt ngắn</label>
        <input type="text" id="art-excerpt" placeholder="Tóm tắt nội dung bài viết...">
      </div>
      <div style="margin-bottom:1.25rem;">
        <label>Nội dung bài viết</label>
        <textarea id="art-content" rows="4" placeholder="Nhập nội dung chi tiết bài viết..."></textarea>
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
    showToast(res.message || 'Tạo bài viết mới thành công!', 'success');
    closeModal();
    loadArticlesList();
  } catch (err) {
    showToast('Lỗi: ' + (err.message || 'Không thể tạo bài viết'), 'error');
    console.error('handleCreateArticleSubmit error:', err);
  }
}

function viewArticleModal(articleId, title) {
  const modalHTML = `
    <div style="padding:0.25rem;">
      <span class="badge-role" style="margin-bottom:0.6rem; display:inline-block;">Truyền thông CMS</span>
      <h2 style="font-size:1.25rem; font-weight:800; color:var(--text-primary); margin-bottom:0.5rem;">${escapeHTML(title)}</h2>
      <div style="font-size:0.825rem; color:var(--text-muted); margin-bottom:1rem;">Đăng ngày ${new Date().toLocaleDateString('vi-VN')} bởi <strong>Ban Truyền thông Sen Trắng</strong></div>
      
      <div style="background:var(--bg-main); padding:1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-light); font-size:0.9rem; color:var(--text-secondary); line-height:1.7;">
        <p>CLB Thanh niên Tình nguyện Sen Trắng chính thức ra mắt hệ thống quản trị <strong>Sen Trắng Hub</strong> với đầy đủ các phân hệ quản lý nhân sự, sự kiện điểm danh QR, truyền thông CMS, đào tạo trắc nghiệm và vinh danh cá nhân.</p>
        <p style="margin-top:0.75rem;">Bài viết đã được xuất bản trực tiếp lên trang chủ để phục vụ công tác truyền thông rộng rãi.</p>
      </div>

      <div style="margin-top:1.25rem; text-align:right;">
        <button class="btn btn-secondary btn-sm" onclick="closeModal()">Đóng lại</button>
      </div>
    </div>
  `;
  showModal('Xem bài viết tin tức', modalHTML);
}

// Expose to global
window.loadArticlesList = loadArticlesList;
window.openCreateArticleModal = openCreateArticleModal;
window.handleCreateArticleSubmit = handleCreateArticleSubmit;
window.viewArticleModal = viewArticleModal;
