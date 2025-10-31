'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, isAuthenticated } from '@/lib/auth';
import { testBackendConnection } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { UserPlus, Building2, Sparkles, Shield, Users, Zap } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        router.replace('/dashboard');
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Test backend connectivity first
    const isConnected = await testBackendConnection();
    if (!isConnected) {
      setError('Cannot connect to backend server. Please check if the server is running on port 3001.');
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      // Use replace instead of push to prevent going back to register
      router.replace('/dashboard');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string | string[] } } }).response;
        if (response?.data?.message && Array.isArray(response.data.message)) {
          setError(response.data.message.join(', '));
        } else if (response?.data?.message) {
          setError(response.data.message as string);
        } else {
          setError('Registration failed');
        }
      } else {
        setError('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      {/* Left side - Registration Form */}
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
                <UserPlus className="h-8 w-8 mr-3 text-blue-600" />
                Create Account
              </CardTitle>
              <p className="text-gray-700 mt-2 font-medium">Join thousands of businesses using our CRM platform.</p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center">
                    <div className="h-2 w-2 bg-red-500 rounded-full mr-3"></div>
                    {error}
                  </div>
                )}

                <Input
                  label="Full Name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Create a secure password (min 6 characters)"
                />

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center text-blue-800">
                    <Shield className="h-5 w-5 mr-2" />
                    <span className="text-sm font-bold">
                      By creating an account, you&apos;ll get your own company workspace with full CRM access.
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={loading}
                  size="lg"
                  className="w-full"
                >
                  {loading ? 'Creating your account...' : 'Create Account'}
                </Button>

                <div className="text-center">
                  <p className="text-gray-700 font-medium">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Features & Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">CRM VISION</h1>
                <p className="text-green-100 text-sm">Customer Relationship Management</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4">Start managing your business relationships</h2>
            <p className="text-xl text-green-100 leading-relaxed">
              Join thousands of businesses who trust our CRM to grow their customer relationships and boost sales.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 mt-1">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Complete Contact Management</h3>
                <p className="text-green-100">Organize all your contacts, companies, and relationships in one powerful platform.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 mt-1">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Sales Pipeline Automation</h3>
                <p className="text-green-100">Track deals, automate follow-ups, and never miss an opportunity again.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 mt-1">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Powerful Analytics</h3>
                <p className="text-green-100">Get insights into your sales performance and customer behavior patterns.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-white/10 rounded-2xl border border-white/20">
            <p className="text-lg font-semibold mb-2">✨ What you get with your free account:</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-100">
              <div>• Unlimited contacts</div>
              <div>• Deal management</div>
              <div>• Activity tracking</div>
              <div>• Company profiles</div>
              <div>• Team collaboration</div>
              <div>• Mobile access</div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 h-32 w-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 h-48 w-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
