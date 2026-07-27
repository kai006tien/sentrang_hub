/**
 * Sen Trắng Hub — Frontend Configuration
 */
const CONFIG = {
  // Nếu phát triển local: 'http://127.0.0.1:8000' hoặc relative '/api' khi deploy Vercel
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : '',

  STORAGE_KEYS: {
    ACCESS_TOKEN: 'sentrang_access_token',
    USER_DATA: 'sentrang_user_data'
  }
};

window.CONFIG = CONFIG;
