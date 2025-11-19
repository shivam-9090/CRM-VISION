/**
 * JWT Migration Helper
 * 
 * This script checks if the stored JWT token includes permissions.
 * If not, it clears the old token and forces re-login.
 * 
 * Background:
 * - JWT payload was updated to include permissions field
 * - Old tokens (before this update) don't have permissions
 * - Backend PermissionsGuard requires permissions in JWT
 * - Result: Old tokens get 403 Forbidden on protected routes
 * 
 * Solution:
 * - Check JWT payload for permissions field
 * - If missing, clear localStorage and redirect to login
 */

export function migrateJWTToken(): boolean {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem('token');
  
  if (!token) {
    return false; // No token to migrate
  }

  try {
    // Decode JWT payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format - clearing token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }

    // Decode base64 payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));

    // Check if permissions field exists
    if (!payload.permissions) {
      console.warn('🔄 Old JWT detected (missing permissions field)');
      console.warn('Clearing token - user will need to log in again');
      
      // Clear old token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return false; // Token cleared
    }

    console.log('✓ JWT includes permissions - no migration needed');
    return true; // Token is current
  } catch (error) {
    console.error('Error checking JWT:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
}
