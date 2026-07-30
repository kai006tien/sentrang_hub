/**
 * Sen Trắng Hub v2 — Authentication & Session Manager
 * Features: Client-side demo fallback for static deployment (Vercel)
 */

const Auth = {
  getUser() {
    const data = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
    if (!data || data === 'undefined' || data === 'null') return null;
    try {
      return JSON.parse(data);
    } catch { return null; }
  },

  isLoggedIn() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const user = this.getUser();
    return !!(token && token !== 'undefined' && user);
  },

  async login(email, password) {
    let data;
    try {
      // 1. Try server API endpoint
      data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    } catch (apiErr) {
      // 2. Client-side fallback for static hostings (Vercel / GitHub Pages / Static Server)
      console.warn('[Auth Fallback] API unavailable or returned error, using client demo auth:', apiErr.message);

      if (email === 'admin@sentranghub.vn' && password === 'SenTrang@2026!') {
        data = {
          access_token: 'demo_token_admin_' + Date.now(),
          user: {
            id: 'admin_uid',
            email: 'admin@sentranghub.vn',
            display_name: 'Admin Hệ Thống',
            role_id: 'role_super_admin',
            role_name: 'Super Admin',
            role_level: 0,
            is_active: true,
            permissions: ['*'],
            created_at: new Date().toISOString()
          }
        };
      } else if (email && password) {
        // Any user login fallback
        data = {
          access_token: 'demo_token_user_' + Date.now(),
          user: {
            id: 'user_' + Date.now(),
            email: email,
            display_name: email.split('@')[0] || 'Thành viên',
            role_id: 'role_thanh_vien',
            role_name: 'Thành viên',
            role_level: 10,
            is_active: true,
            permissions: ['quizzes.take', 'events.create', 'articles.create'],
            created_at: new Date().toISOString()
          }
        };
      } else {
        showToast('Vui lòng nhập Email và Mật khẩu!', 'warning');
        throw new Error('Vui lòng nhập Email và Mật khẩu');
      }
    }

    if (data && data.user) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, data.access_token || 'demo_token');
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
      showToast(`Xin chào ${data.user.display_name}! Đăng nhập thành công.`, 'success');
    } else {
      showToast('Đăng nhập không thành công', 'error');
      throw new Error('Dữ liệu tài khoản không hợp lệ');
    }
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 600);

    return data;
  },

  logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    showToast('Đã đăng xuất tài khoản', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  },

  async changePassword(oldPassword, newPassword) {
    try {
      const data = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          old_password: oldPassword,
          current_password: oldPassword,
          new_password: newPassword
        })
      });
      if (data && (data.success || data.message)) {
        showToast(data.message || 'Đổi mật khẩu thành công!', 'success');
        return data;
      }
      if (data && data.detail) {
        showToast(data.detail, 'error');
        throw new Error(data.detail);
      }
      return data;
    } catch (err) {
      if (!err.message.includes('Lỗi')) {
        showToast('Lỗi đổi mật khẩu: ' + err.message, 'error');
      }
      throw err;
    }
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
    }
  },

  redirectIfAuthenticated() {
    if (this.isLoggedIn()) {
      window.location.href = 'dashboard.html';
    }
  }
};

function openChangePasswordModal() {
  const user = Auth.getUser();
  const email = user ? escapeHTML(user.email) : 'tài khoản';
  showModal('🔑 Đổi Mật Khẩu Tài Khoản', `
    <form onsubmit="handleChangePasswordSubmit(event)">
      <div style="background:var(--info-bg);border:1px solid rgba(33,150,243,0.2);border-radius:var(--radius-md);padding:0.75rem;margin-bottom:1rem;font-size:0.825rem;color:var(--primary-700);">
        🔒 Thay đổi mật khẩu đăng nhập cho <strong>${email}</strong>.
      </div>
      <div style="margin-bottom:0.85rem;">
        <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:0.35rem;">Mật khẩu hiện tại *</label>
        <input type="password" id="cp-current-pass" required placeholder="Nhập mật khẩu hiện tại" style="width:100%;">
      </div>
      <div style="margin-bottom:0.85rem;">
        <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:0.35rem;">Mật khẩu mới *</label>
        <input type="password" id="cp-new-pass" required placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)" minlength="6" style="width:100%;">
      </div>
      <div style="margin-bottom:1.25rem;">
        <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:0.35rem;">Xác nhận mật khẩu mới *</label>
        <input type="password" id="cp-confirm-pass" required placeholder="Nhập lại mật khẩu mới" minlength="6" style="width:100%;">
      </div>
      <button type="submit" class="btn btn-primary btn-block">🔒 Cập Nhật Mật Khẩu</button>
    </form>
  `);
}

async function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const currentPass = document.getElementById('cp-current-pass').value;
  const newPass = document.getElementById('cp-new-pass').value;
  const confirmPass = document.getElementById('cp-confirm-pass').value;

  if (newPass !== confirmPass) {
    showToast('Mật khẩu mới và xác nhận mật khẩu không khớp!', 'warning');
    return;
  }

  try {
    await Auth.changePassword(currentPass, newPass);
    closeModal();
  } catch (err) {
    /* Handled inside changePassword */
  }
}

window.Auth = Auth;
window.openChangePasswordModal = openChangePasswordModal;
window.handleChangePasswordSubmit = handleChangePasswordSubmit;

