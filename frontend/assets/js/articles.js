/**
 * Sen Trắng Hub — Articles CMS Frontend Controller
 */

async function loadArticlesList() {
  const tbody = document.getElementById('articles-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-dim);">Đang tải bài viết...</td></tr>';

  try {
    const articles = await apiFetch('/api/articles');

    if (articles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-dim);">Chưa có bài viết nào. Hãy soạn bài viết mới!</td></tr>';
      return;
    }

    tbody.innerHTML = articles.map((a, index) => {
      const isPublished = a.status === 'published';
      const statusBadge = isPublished
        ? '<span class="badge badge-active">Đã xuất bản</span>'
        : '<span class="badge badge-inactive">Bản nháp</span>';

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <div style="font-weight: 700; color: var(--text-main);">${a.title}</div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">${a.slug}</div>
          </td>
          <td><span class="badge badge-chu_nhiem">${a.category}</span></td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn-sm btn-outline" onclick="togglePublishArticle('${a.id}', '${a.status}')">
              ${isPublished ? 'Gỡ bài' : '🚀 Xuất bản'}
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--accent-red);">Lỗi: ${err.message}</td></tr>`;
  }
}

function openCreateArticleModal() {
  const modal = document.getElementById('modal-create-article');
  if (modal) modal.classList.add('active');
}

async function handleUploadArticleImage(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

  try {
    showToast('Đang tải ảnh lên Cloudflare R2...', 'success');
    const res = await fetch(`${CONFIG.API_BASE_URL}/api/articles/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Upload lỗi');

    document.getElementById('article-cover-url').value = data.url;
    showToast('Upload ảnh thành công lên Cloudflare R2!', 'success');
  } catch (err) {
    showToast(err.message || 'Upload ảnh thất bại', 'error');
  }
}

async function handleCreateArticleSubmit(e) {
  e.preventDefault();

  const payload = {
    title: document.getElementById('article-title').value,
    category: document.getElementById('article-category').value,
    excerpt: document.getElementById('article-excerpt').value,
    content: document.getElementById('article-content').value,
    cover_image_url: document.getElementById('article-cover-url').value || null
  };

  try {
    await apiFetch('/api/articles', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    showToast('Tạo bài viết nháp thành công!', 'success');
    closeModal('modal-create-article');
    loadArticlesList();
  } catch (err) {
    showToast(err.message || 'Tạo bài viết thất bại', 'error');
  }
}

async function togglePublishArticle(articleId, currentStatus) {
  const newStatus = currentStatus === 'published' ? 'draft' : 'published';

  try {
    const res = await apiFetch(`/api/articles/${articleId}/publish?status=${newStatus}`, {
      method: 'PUT'
    });

    showToast(res.message, 'success');
    loadArticlesList();
  } catch (err) {
    showToast(err.message || 'Cập nhật trạng thái thất bại', 'error');
  }
}

window.loadArticlesList = loadArticlesList;
window.openCreateArticleModal = openCreateArticleModal;
window.handleUploadArticleImage = handleUploadArticleImage;
window.handleCreateArticleSubmit = handleCreateArticleSubmit;
window.togglePublishArticle = togglePublishArticle;
