// Simple auth utilities without automatic redirects
export function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for token in localStorage (fallback) or check for cookie
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const hasCookie = document.cookie.includes('token=');
  
  // Debug logging
  console.log('🔍 Auth Check:', { 
    hasToken: !!token, 
    hasUser: !!user,
    hasCookie,
    allCookies: document.cookie,
    token: token ? `${token.substring(0, 20)}...` : null,
    result: !!(token && user) || hasCookie
  });
  
  return !!(token && user) || hasCookie;
}

// Async version that verifies with backend
export async function verifyAuthToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    // Try to verify with backend
    const response = await fetch('http://localhost:3001/api/auth/verify', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Include auth header if token exists
        ...(localStorage.getItem('token') && {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        })
      },
      credentials: 'include', // Include cookies
    });

    if (response.ok) {
      const data = await response.json();
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      }
    }
    
    // If verification fails, clear stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  } catch (error) {
    console.error('Auth verification failed:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

export function clearAuthData() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function storeAuthData(token: string, user: any) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}