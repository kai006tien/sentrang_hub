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

    localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));

    showToast(`Xin chào ${data.user.display_name}! Đăng nhập thành công.`, 'success');
    
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

window.Auth = Auth;
