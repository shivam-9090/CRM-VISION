'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Building2, Users, Briefcase, DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setMounted(true);
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        router.push('/auth/login');
      }
      setChecking(false);
    };
    checkAuth();
  }, [router]);

  if (!mounted || checking) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2 animate-fade-in">Dashboard</h1>
          <p className="text-lg text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your CRM.</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-gray-200 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Companies</p>
                  <p className="text-3xl font-bold text-black">0</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +0% from last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Contacts</p>
                  <p className="text-3xl font-bold text-black">0</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +0% from last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Deals</p>
                  <p className="text-3xl font-bold text-black">0</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +0% from last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-black">$0</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +0% from last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-black" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No recent activities</p>
                <p className="text-sm text-gray-400 mt-1">Activities will appear here when you start using the system</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-black" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all duration-200 transform hover:scale-[1.02]">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-black mr-3" />
                    <div>
                      <p className="font-semibold text-black">Add New Company</p>
                      <p className="text-sm text-gray-600">Create a new company record</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all duration-200 transform hover:scale-[1.02]">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-black mr-3" />
                    <div>
                      <p className="font-semibold text-black">Add New Contact</p>
                      <p className="text-sm text-gray-600">Create a new contact record</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all duration-200 transform hover:scale-[1.02]">
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-black mr-3" />
                    <div>
                      <p className="font-semibold text-black">Create New Deal</p>
                      <p className="text-sm text-gray-600">Start tracking a new deal</p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
