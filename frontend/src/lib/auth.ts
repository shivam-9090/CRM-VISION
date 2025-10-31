import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string;
}

export const login = async (email: string, password: string) => {
  console.log('Login attempt:', { email });
  try {
    const response = await api.post('/auth/login', { email, password });
    console.log('Login response:', response.data);
    const { user, token } = response.data;
    
    // Store token if provided
    if (token) {
      localStorage.setItem('token', token);
    }
    
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (data: {
  email: string;
  password: string;
  name: string;
  companyId?: string;
}) => {
  console.log('Register attempt:', data);
  console.log('API base URL being used:', api.defaults.baseURL);
  try {
    const response = await api.post('/auth/register', data);
    console.log('Register response:', response.data);
    const { user, token } = response.data;
    
    // Store token if provided
    if (token) {
      localStorage.setItem('token', token);
    }
    
    return user;
  } catch (error) {
    console.error('Register error:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; statusText?: string; data?: unknown }; message?: string; code?: string };
      console.error('Error details:', {
        message: axiosError.message,
        code: axiosError.code,
        response: axiosError.response ? {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data
        } : 'No response object'
      });
    }
    throw error;
  }
};

export const logout = async () => {
  try {
    // Call backend logout to clear httpOnly cookie
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear all auth data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login
    window.location.href = '/auth/login';
  }
};

export const verify = async () => {
  try {
    // Always try to verify with backend (it will use httpOnly cookie)
    const response = await api.get('/auth/verify');
    
    // Store user data in localStorage for quick access
    if (response.data.user && typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data.user;
  } catch (error) {
    // Clear any stored auth data on failed verification
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  // Since we're using httpOnly cookies, we need to verify with the backend
  if (typeof window === 'undefined') return false;
  
  try {
    const user = await verify();
    return !!user;
  } catch {
    return false;
  }
};
