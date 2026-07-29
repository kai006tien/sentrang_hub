/**
 * Sen Trắng Hub v2 — API Wrapper, Toast & Permission System
 */

// Toast Notifications
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || '•'}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Fetch API Wrapper
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Đã xảy ra lỗi không xác định');
    }
    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

// Endpoint resolver
function resolveEndpoint(endpoint) {
  if (endpoint.startsWith('/api/')) return endpoint;
  return `/api${endpoint}`;
}

// API Object
const API = {
  get(endpoint) { return apiFetch(resolveEndpoint(endpoint), { method: 'GET' }); },
  post(endpoint, body) {
    return apiFetch(resolveEndpoint(endpoint), {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  },
  put(endpoint, body) {
    return apiFetch(resolveEndpoint(endpoint), {
      method: 'PUT',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
  },
  delete(endpoint) { return apiFetch(resolveEndpoint(endpoint), { method: 'DELETE' }); }
};

// ========== PERMISSION SYSTEM ==========
function getCurrentUserPermissions() {
  const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
  if (!userData) return [];
  try {
    const user = JSON.parse(userData);
    return user.permissions || [];
  } catch { return []; }
}

function hasPermission(permission) {
  const perms = getCurrentUserPermissions();
  return perms.includes('*') || perms.includes(permission);
}

function isSuperAdmin() {
  const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
  if (!userData) return false;
  try {
    const user = JSON.parse(userData);
    return user.role_id === 'role_super_admin' || user.role_level === 0;
  } catch { return false; }
}

// Expose globals
window.showToast = showToast;
window.apiFetch = apiFetch;
window.API = API;
window.hasPermission = hasPermission;
window.isSuperAdmin = isSuperAdmin;
window.getCurrentUserPermissions = getCurrentUserPermissions;
