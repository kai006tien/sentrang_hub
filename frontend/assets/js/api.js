/**
 * Sen Trắng Hub — API Wrapper & Toast Notification System
 */

// Toast Notifications System
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✓' : '✕';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

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
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${CONFIG.API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.detail || data.message || 'Đã xảy ra lỗi không xác định';
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

function resolveEndpoint(endpoint) {
  if (endpoint.startsWith('/api/')) return endpoint;
  if (endpoint.startsWith('/v1/')) return `/api${endpoint}`;
  if (endpoint === '/events' || endpoint.startsWith('/events/') ||
      endpoint === '/articles' || endpoint.startsWith('/articles/') ||
      endpoint === '/quizzes' || endpoint.startsWith('/quizzes/')) {
    return `/api${endpoint}`;
  }
  return `/api/v1${endpoint}`;
}

const API = {
  get(endpoint) {
    return apiFetch(resolveEndpoint(endpoint), { method: 'GET' });
  },
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
  delete(endpoint) {
    return apiFetch(resolveEndpoint(endpoint), { method: 'DELETE' });
  }
};

window.showToast = showToast;
window.apiFetch = apiFetch;
window.API = API;
