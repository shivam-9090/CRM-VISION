'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasAuthToken, verifyAuthToken } from '@/lib/auth-utils';

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    
    // Implement the exact flow from diagram:
    // URL:3000 (first time) → check auth → if logged in go to dashboard, else go to login
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        // First do a quick local check
        const hasToken = hasAuthToken();
        
        if (hasToken) {
          console.log('🏠 Root Page: Local token found, verifying with backend...');
          // Verify with backend
          const isValid = await verifyAuthToken();
          
          if (isValid) {
            console.log('🏠 Root Page: Valid token, redirecting to dashboard');
            router.replace('/dashboard');
          } else {
            console.log('🏠 Root Page: Invalid token, redirecting to login');
            router.replace('/auth/login');
          }
        } else {
          console.log('🏠 Root Page: No token found, redirecting to login');
          router.replace('/auth/login');
        }
        
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // Prevent hydration mismatch
  if (!isMounted || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!isMounted ? 'Loading...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  return null; // Should never reach here as we redirect
}
