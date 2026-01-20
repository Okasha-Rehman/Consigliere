import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateGoals: (goals) => api.put('/user/goals', goals),
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/user/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Check-in API
export const checkInAPI = {
  create: (data) => api.post('/check-in', data),
  getToday: () => api.get('/check-in/today'),
  getHistory: (limit = 30) => api.get(`/check-in/history?limit=${limit}`),
};

// Streak API
export const streakAPI = {
  get: () => api.get('/streak'),
};

// Quote API
export const quoteAPI = {
  getDaily: () => api.get('/quote/today'),
};

// Analytics API
export const analyticsAPI = {
  getWeekly: () => api.get('/analytics/weekly'),
  getMonthly: (month, year) => {
    const params = month && year ? `?month=${month}&year=${year}` : '';
    return api.get(`/analytics/monthly${params}`);
  },
};

// Dashboard API
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export default api;
