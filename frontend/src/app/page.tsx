'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasAuthToken } from '@/lib/auth-utils';

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Implement the exact flow from diagram:
    // URL:3000 (first time) → check auth → if logged in go to dashboard, else go to login
    if (typeof window !== 'undefined') {
      const isLoggedIn = hasAuthToken();
      
      console.log('🏠 Root Page: Auth check result:', isLoggedIn);
      
      if (isLoggedIn) {
        // User is already logged in, go to dashboard
        console.log('🏠 Root Page: Redirecting to dashboard');
        router.replace('/dashboard');
      } else {
        // First time visit or not logged in, go to login/auth
        console.log('🏠 Root Page: Redirecting to login');
        router.replace('/auth/login');
      }
    }
  }, [router]);

  // Prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
