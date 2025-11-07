'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { hasAuthToken, storeAuthData } from '@/lib/auth-utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LogIn, Building2, Sparkles } from 'lucide-react';
import TwoFactorVerify from '@/components/TwoFactorVerify';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLoggedIn = hasAuthToken();
      
      if (isLoggedIn) {
        // User already logged in, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // User not logged in, show login form
        setCheckingAuth(false);
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation
    if (!email.trim()) {
      setError('Email address is required');
      setLoading(false);
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    try {
      // Make login API call - the backend will set httpOnly cookie
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });

      // Check if 2FA is required
      if (response.data.requiresTwoFactor) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      // Store user data in localStorage for quick access (token is in httpOnly cookie)
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Also store token if provided for backward compatibility
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
      }

      console.log('🔑 Login successful!', response.data);
      console.log('🔑 Token stored:', !!response.data.token);
      console.log('🔑 User stored:', !!response.data.user);
      
      // Redirect to dashboard after successful login
      router.replace('/dashboard');
    } catch (err: unknown) {
      console.error('Login error:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string | string[]; error?: { message?: string | string[] } } } }).response;
        
        // Handle different error response formats from backend
        const errorMessage = response?.data?.error?.message || response?.data?.message;
        
        if (errorMessage && Array.isArray(errorMessage)) {
          // Backend validation errors (array of messages)
          setError(errorMessage.join(', '));
        } else if (errorMessage && typeof errorMessage === 'string') {
          // Single error message
          setError(errorMessage);
        } else {
          setError('Login failed. Please check your credentials and try again.');
        }
      } else {
        setError('Login failed. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorVerify = async (token: string) => {
    setTwoFactorError(null);
    setLoading(true);

    try {
      // Make login API call with 2FA token
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        twoFactorToken: token
      });

      // Store user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
      }

      console.log('🔑 2FA Login successful!', response.data);
      
      // Redirect to dashboard
      router.replace('/dashboard');
    } catch (err: unknown) {
      console.error('2FA verify error:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setTwoFactorError(response?.data?.message || 'Invalid 2FA code. Please try again.');
      } else {
        setTwoFactorError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">CRM VISION</h1>
                <p className="text-blue-100 text-sm">Customer Relationship Management</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4">Welcome back to your CRM</h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              Manage your customers, deals, and business relationships with our powerful CRM platform.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center text-blue-100">
              <Sparkles className="h-5 w-5 mr-3" />
              <span>Advanced customer relationship management</span>
            </div>
            <div className="flex items-center text-blue-100">
              <Sparkles className="h-5 w-5 mr-3" />
              <span>Real-time analytics and reporting</span>
            </div>
            <div className="flex items-center text-blue-100">
              <Sparkles className="h-5 w-5 mr-3" />
              <span>Streamlined sales pipeline management</span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 h-32 w-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 h-48 w-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center mb-8 lg:hidden">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center mr-3">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CRM VISION</h1>
              <p className="text-gray-600 text-sm">Customer Relationship Management</p>
            </div>
          </div>

          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl font-bold text-gray-900 flex items-center justify-center">
                <LogIn className="h-8 w-8 mr-3 text-blue-600" />
                {requires2FA ? 'Two-Factor Authentication' : 'Sign In'}
              </CardTitle>
              <p className="text-gray-700 mt-2 font-medium">
                {requires2FA
                  ? 'Enter the code from your authenticator app'
                  : 'Welcome back! Please sign in to your account.'}
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {requires2FA ? (
                <div className="space-y-4">
                  <TwoFactorVerify
                    onVerify={handleTwoFactorVerify}
                    loading={loading}
                    error={twoFactorError}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRequires2FA(false);
                      setTwoFactorError(null);
                      setPassword('');
                    }}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center">
                    <div className="h-2 w-2 bg-red-500 rounded-full mr-3"></div>
                    {error}
                  </div>
                )}

                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter your password (min 6 characters)"
                />

                <Button
                  type="submit"
                  isLoading={loading}
                  size="lg"
                  className="w-full"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="text-center">
                  <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot your password?
                  </Link>
                </div>

                <div className="text-center">
                  <p className="text-gray-700 font-medium">
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      Create one here
                    </Link>
                  </p>
                </div>
              </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
