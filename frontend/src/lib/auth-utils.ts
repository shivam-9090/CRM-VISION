// Simple auth utilities without automatic redirects
import { migrateJWTToken } from './jwt-migration';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Helper function to decode JWT and check expiration
function isTokenExpired(token: string): boolean {
  try {
    // Decode JWT payload (base64)
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Check if token has expired (exp is in seconds, Date.now() is in milliseconds)
    if (payload.exp) {
      const expirationTime = payload.exp * 1000;
      const now = Date.now();
      const isExpired = now > expirationTime;
      
      if (isExpired) {
        console.log('⚠️ Token expired:', {
          expiredAt: new Date(expirationTime).toISOString(),
          now: new Date(now).toISOString()
        });
      }
      
      return isExpired;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error checking token expiration:', error);
    return true; // Treat as expired if we can't decode
  }
}

export function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  
  // MIGRATION: Check if JWT has permissions field, clear if not
  migrateJWTToken();
  
  // Check for token in localStorage (fallback) or check for cookie
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const hasCookie = document.cookie.includes('token=');
  
  // Check if token is expired
  if (token && isTokenExpired(token)) {
    console.log('🔄 Clearing expired token from localStorage');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return hasCookie; // Rely on cookie if available
  }
  
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
    const response = await fetch(`${API_URL}/auth/verify`, {
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