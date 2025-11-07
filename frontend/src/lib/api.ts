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
  withCredentials: true, // Important for cookies
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Add token to requests
api.interceptors.request.use((config) => {
  // Token is now in httpOnly cookie, no need to add manually
  // But keep localStorage fallback for transition period
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Making API request to:', `${config.baseURL || API_URL}${config.url || ''}`);
  }
  return config;
});

// Handle auth errors and refresh token
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API response received:', response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

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
          data: error.response?.data || null,
          method: error.config?.method?.toUpperCase() || 'UNKNOWN',
        };
        
        console.error('API Error:', errorInfo);
      }
    }
    
    // Handle 401 errors with refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh on auth endpoints
      if (originalRequest.url?.includes('/auth/login') || 
          originalRequest.url?.includes('/auth/register') ||
          originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token from localStorage (temporary fallback)
        const refreshToken = localStorage.getItem('refreshToken');
        
        // Try to refresh the access token
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        if (response.data.accessToken) {
          // Store new access token (temporary fallback)
          localStorage.setItem('token', response.data.accessToken);
          
          // Update user data if included
          if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }

          processQueue(null, response.data.accessToken);
          isRefreshing = false;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(new Error('Failed to refresh token'), null);
        isRefreshing = false;
        
        // Clear auth data on refresh failure
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/auth/login')) {
          console.log('Refresh token expired - redirecting to login');
          window.location.href = '/auth/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // For other errors, just reject
    if (error.response?.status === 401) {
      // Clear auth data on other 401 errors
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
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
