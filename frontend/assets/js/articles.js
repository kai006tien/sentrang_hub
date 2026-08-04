/**
 * Sen Trắng Hub v2 — Articles CMS Module
 * Features: Permission-gated, image upload, rich article creation
 */

async function loadArticlesList() {
  const container = document.getElementById('articles-container');
  const actionsEl = document.getElementById('articles-action-buttons');
  if (!container) return;

  if (actionsEl) {
    let btns = (hasPermission('articles.create') || isSuperAdmin()) ? `<button class="btn btn-primary btn-sm" onclick="openCreateArticleModal()">+ Bài viết mới</button>` : '';
    if (isSuperAdmin()) {
      btns += ` <button class="btn btn-danger btn-sm" onclick="openResetModuleModal('articles')">🔄 Reset CMS</button>`;
    }
    actionsEl.innerHTML = btns;
  }
  container.innerHTML = '<div class="text-center">Đang tải...</div>';
  try {
    const res = await apiFetch('/api/articles');
    const articles = Array.isArray(res) ? res : (res.data || []);
    if (articles.length === 0) { container.innerHTML = '<div class="text-center">Chưa có bài viết.</div>'; return; }

    const catLabels = { 'tin-tuc':{label:'Tin tức',bg:'#E3F2FD',text:'#0D47A1'}, 'su-kien':{label:'Sự kiện',bg:'#FFF3E0',text:'#E65100'}, 'thong-bao':{label:'Thông báo',bg:'#F3E5F5',text:'#6A1B9A'} };
    container.innerHTML = articles.map(a => {
      const cat = catLabels[a.category] || {label:a.category||'Tin tức',bg:'#E3F2FD',text:'#0D47A1'};
      const hasImg = a.image_url && a.image_url.startsWith('data:');
      return `<div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-xl);box-shadow:var(--shadow-sm);overflow:hidden;transition:all 0.25s ease;display:flex;flex-direction:column;" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='none'">
        ${hasImg ? `<div style="width:100%;height:140px;background:url('${a.image_url}') center/cover no-repeat;"></div>` : ''}
        <div style="padding:1.25rem;flex:1;display:flex;flex-direction:column;">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
            <span style="font-size:0.72rem;padding:0.2rem 0.6rem;background:${cat.bg};color:${cat.text};font-weight:700;border-radius:var(--radius-full);">${cat.label}</span>
            <span style="font-size:0.72rem;color:var(--text-muted);">👁️ ${a.view_count||0}</span>
          </div>
          <h4 style="font-size:1rem;font-weight:700;margin-bottom:0.35rem;">${escapeHTML(a.title)}</h4>
          <p style="font-size:0.825rem;color:var(--text-muted);margin-bottom:1rem;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHTML(a.excerpt||'')}</p>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-light);padding-top:0.75rem;">
            <span style="font-size:0.72rem;color:var(--text-muted);">✍️ ${escapeHTML(a.author_name||'Ban TT')}</span>
            <button class="btn btn-secondary btn-sm" onclick="viewArticleModal('${a.id}')">📰 Đọc</button>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch (err) { container.innerHTML = `<div class="text-center text-danger">Lỗi: ${escapeHTML(err.message)}</div>`; }
}

function openCreateArticleModal() {
  if (!hasPermission('articles.create') && !isSuperAdmin()) {
    showToast('🔒 Bạn không có quyền soạn/xuất bản bài viết mới! Vui lòng liên hệ Admin.', 'warning');
    return;
  }
  showModal('Soạn Bài Viết Mới', `
    <form onsubmit="handleCreateArticleSubmit(event)">
      <div style="margin-bottom:0.85rem;"><label>Tiêu đề bài viết *</label><input type="text" id="art-title" required placeholder="Tiêu đề bài viết"></div>
      <div style="margin-bottom:0.85rem;"><label>Danh mục</label><select id="art-cat"><option value="tin-tuc">Tin tức & Báo chí</option><option value="su-kien">Sự kiện CLB</option><option value="thong-bao">Thông báo nội bộ</option></select></div>
      <div style="margin-bottom:0.85rem;">
        <label>Ảnh đại diện bài viết</label>
        <input type="file" id="art-image" accept="image/*" onchange="previewArticleImage(this)" style="padding:0.5rem;">
        <div id="art-image-preview" style="margin-top:0.5rem;display:none;"><img id="art-image-preview-img" style="width:100%;max-height:200px;object-fit:cover;border-radius:var(--radius-md);border:1px solid var(--border-light);"></div>
      </div>
      <div style="margin-bottom:0.85rem;"><label>Tóm tắt ngắn</label><input type="text" id="art-excerpt" placeholder="Mô tả tóm lược nội dung bài viết..."></div>
      <div style="margin-bottom:1.25rem;"><label>Nội dung bài viết</label><textarea id="art-content" rows="6" placeholder="Nhập nội dung chi tiết bài viết..." style="min-height:120px;"></textarea></div>
      <button type="submit" class="btn btn-primary btn-block">📰 Xuất Bản Bài Viết</button>
    </form>`);
}

function previewArticleImage(input) {
  const preview = document.getElementById('art-image-preview');
  const img = document.getElementById('art-image-preview-img');
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const tempImg = new Image();
      tempImg.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        let width = tempImg.width;
        let height = tempImg.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(tempImg, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        img.src = compressedDataUrl;
        preview.style.display = 'block';
      };
      tempImg.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function handleCreateArticleSubmit(e) {
  e.preventDefault();
  if (!hasPermission('articles.create') && !isSuperAdmin()) {
    showToast('🔒 Bạn không có quyền soạn/xuất bản bài viết mới!', 'error');
    return;
  }
  const imgPreview = document.getElementById('art-image-preview-img');
  const payload = {
    title: document.getElementById('art-title').value,
    category: document.getElementById('art-cat').value,
    excerpt: document.getElementById('art-excerpt').value,
    content: document.getElementById('art-content').value,
    image_url: imgPreview?.src || '',
    status: 'published'
  };
  try {
    const res = await API.post('/articles', payload);
    showToast(res.message || 'Tạo bài viết thành công!', 'success');
    closeModal(); loadArticlesList();
    if (typeof performSyncCheck === 'function') performSyncCheck();
  } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
}

function viewArticleModal(articleId) {
  apiFetch('/api/articles').then(articles => {
    const list = Array.isArray(articles) ? articles : [];
    const a = list.find(x => x.id === articleId) || list[0];
    if (!a) return;
    const hasImg = a.image_url && a.image_url.startsWith('data:');
    showModal('📰 ' + a.title, `
      <div>
        ${hasImg ? `<img src="${a.image_url}" style="width:100%;max-height:250px;object-fit:cover;border-radius:var(--radius-md);margin-bottom:1rem;">` : ''}
        <div style="font-size:0.825rem;color:var(--text-muted);margin-bottom:1rem;">✍️ ${escapeHTML(a.author_name||'Ban TT')} • ${safeFormatDate(a.created_at || Date.now(), 'Vừa xong')}</div>
        <div style="font-size:0.9rem;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap;">${escapeHTML(a.content||a.excerpt||'Nội dung bài viết.')}</div>
      </div>
    `);
  }).catch(err => showToast('Lỗi: ' + err.message, 'error'));
}

window.loadArticlesList = loadArticlesList;
window.openCreateArticleModal = openCreateArticleModal;
window.handleCreateArticleSubmit = handleCreateArticleSubmit;
window.previewArticleImage = previewArticleImage;
window.viewArticleModal = viewArticleModal;
