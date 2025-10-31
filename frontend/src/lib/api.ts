import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Only log in development
if (process.env.NODE_ENV === 'development') {
  console.log('API_URL configured as:', API_URL);
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  // Add token from localStorage if available (fallback for non-httpOnly cookie setups)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Making API request to:', `${config.baseURL || API_URL}${config.url || ''}`);
    console.log('Headers:', config.headers);
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API response received:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    // Only log detailed errors in development (but skip 401 on /auth/verify)
    if (process.env.NODE_ENV === 'development') {
      const isAuthCheck = error.config?.url?.includes('/auth/verify');
      const is401 = error.response?.status === 401;
      
      // Don't log 401 errors on auth verification checks
      if (!(isAuthCheck && is401)) {
        const errorInfo = {
          status: error.response?.status || 'No response',
          url: `${error.config?.baseURL || API_URL}${error.config?.url || ''}`,
          message: error.response?.data?.message || error.message || 'Unknown error',
          method: error.config?.method?.toUpperCase() || 'UNKNOWN',
        };
        
        console.error('API Error:', errorInfo);
        
        // Only log response data if it exists and is meaningful
        if (error.response?.data && typeof error.response.data === 'object') {
          console.error('Response data:', error.response.data);
        }
        
        // Only log full error for server errors
        if (error.response?.status && error.response.status >= 500) {
          console.error('Full error details:', error);
        }
      }
    }
    
    if (error.response?.status === 401) {
      // Clear auth data on 401
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page and not an auth check
      const isAuthCheck = error.config?.url?.includes('/auth/verify');
      if (!isAuthCheck && !window.location.pathname.includes('/auth/login')) {
        console.log('Unauthorized - redirecting to login');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Test function to verify backend connectivity (development only)
export const testBackendConnection = async () => {
  if (process.env.NODE_ENV !== 'development') return true;
  
  try {
    console.log('Testing backend connection...');
    const response = await fetch(`${API_URL.replace('/api', '')}/api`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Backend test response:', response.status, response.statusText);
    return response.ok;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
};

export default api;
