'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthData, hasAuthToken, getStoredUser } from '@/lib/auth-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function DebugPage() {
  const router = useRouter();
  const [authData, setAuthData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const hasAuth = hasAuthToken();
      const storedUser = getStoredUser();

      setAuthData({
        hasToken: !!token,
        hasUser: !!user,
        hasAuth,
        token: token ? `${token.substring(0, 30)}...` : null,
        user: storedUser,
        fullToken: token
      });
    }
  }, []);

  const handleClearAuth = () => {
    clearAuthData();
    alert('Auth data cleared! Reloading page...');
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🔍 Authentication Debug Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Current Auth State:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(authData, null, 2)}
              </pre>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleClearAuth}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Auth Data
              </button>
              
              <button
                onClick={handleGoHome}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Home (/)
              </button>
              
              <button
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Go to Login
              </button>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Go to Dashboard
              </button>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Expected Flow:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Visit <code>/debug</code> to check auth state</li>
                <li>If auth data exists but shouldn&apos;t, click &quot;Clear Auth Data&quot;</li>
                <li>Click &quot;Go to Home (/)&quot; to test redirect</li>
                <li>Should redirect to login if no auth, dashboard if authenticated</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}