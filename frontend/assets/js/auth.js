/**
 * Sen Trắng Hub — Authentication & Session Manager
 */

const Auth = {
  // Lấy thông tin user từ localStorage
  getUser() {
    const data = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  // Kiểm tra đã đăng nhập chưa
  isLoggedIn() {
    return !!localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  },

  // Xử lý Đăng nhập
  async login(email, password) {
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));

      showToast(`Xin chào ${data.user.display_name}! Đăng nhập thành công.`, 'success');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);

      return data;
    } catch (error) {
      showToast(error.message || 'Đăng nhập thất bại', 'error');
      throw error;
    }
  },

  // Đăng xuất
  logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    showToast('Đã đăng xuất tài khoản', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);
  },

  // Kiểm tra quyền trên trang Dashboard
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'index.html';
    }
  },

  // Nếu đã đăng nhập thì không cho vào trang Login
  redirectIfAuthenticated() {
    if (this.isLoggedIn()) {
      window.location.href = 'dashboard.html';
    }
  }
};

window.Auth = Auth;
