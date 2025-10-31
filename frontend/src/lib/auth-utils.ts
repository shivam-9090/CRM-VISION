// Simple auth utilities without automatic redirects
export function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // Debug logging
  console.log('🔍 Auth Check:', { 
    hasToken: !!token, 
    hasUser: !!user, 
    token: token ? `${token.substring(0, 20)}...` : null,
    result: !!(token && user)
  });
  
  return !!(token && user);
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