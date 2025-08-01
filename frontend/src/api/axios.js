import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,  // No fallback, must be set in .env
  withCredentials: true,                   // Required to send cookies for auth
  timeout: 10000,                          // 10 seconds timeout
});

// Request interceptor for logging requests
api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL || ''}${config.url}`;
    console.log(`API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    console.error('API Response Error:', data || error.message);

    // Global 401 Unauthorized handling - redirect to login
    if (status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
