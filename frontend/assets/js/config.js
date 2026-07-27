/**
 * Sen Trắng Hub — Frontend Configuration
 */
const CONFIG = {
  // API URL: Sử dụng relative path '/api' để hoạt động với cả local server và Vercel
  API_BASE_URL: '',

  STORAGE_KEYS: {
    ACCESS_TOKEN: 'sentrang_access_token',
    USER_DATA: 'sentrang_user_data'
  }
};

window.CONFIG = CONFIG;
