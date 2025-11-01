'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasAuthToken, verifyAuthToken } from '@/lib/auth-utils';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Building2, Users, Briefcase, DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react';
import api from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalCompanies: 0,
    totalContacts: 0,
    activeDeals: 0,
    totalRevenue: 0,
    recentActivities: [],
    loading: true
  });

  const fetchDashboardData = async () => {
    try {
      console.log('📊 Fetching dashboard data...');
      
      // Fetch all data in parallel
      const [companiesRes, contactsRes, dealsRes, dealsStatsRes, activitiesRes] = await Promise.all([
        api.get('/companies'),
        api.get('/contacts'),
        api.get('/deals'),
        api.get('/deals/stats/my-deals'),
        api.get('/activities')
      ]);

      // Calculate metrics
      const totalCompanies = companiesRes.data.length || 0;
      const totalContacts = contactsRes.data.length || 0;
      
      // Handle paginated deals response
      const dealsData = dealsRes.data.data || dealsRes.data || [];
      const activeDeals = dealsData.filter((deal: any) => 
        !['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage)
      ).length || 0;
      
      // Calculate revenue from closed won deals
      const totalRevenue = dealsData
        .filter((deal: any) => deal.stage === 'CLOSED_WON')
        .reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);

      // Get recent activities (last 5)
      const recentActivities = activitiesRes.data.slice(0, 5) || [];

      setDashboardData({
        totalCompanies,
        totalContacts,
        activeDeals,
        totalRevenue,
        recentActivities,
        loading: false
      });

      console.log('📊 Dashboard data loaded:', {
        totalCompanies,
        totalContacts,
        activeDeals,
        totalRevenue: `$${totalRevenue.toLocaleString()}`,
        recentActivities: recentActivities.length
      });

    } catch (error) {
      console.error('📊 Error fetching dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    setMounted(true);
    
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        // Add debugging info
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        console.log('📊 Dashboard Auth Check:', {
          hasTokenInLS: !!token,
          hasUserInLS: !!user,
          tokenPreview: token ? token.substring(0, 20) + '...' : null
        });
        
        // First do a quick local check
        const hasToken = hasAuthToken();
        
        if (hasToken) {
          console.log('📊 Dashboard: Local token found, verifying with backend...');
          // Verify with backend
          const isValid = await verifyAuthToken();
          
          if (isValid) {
            console.log('📊 Dashboard: Valid token, showing dashboard');
            setIsAuthorized(true);
            // Fetch dashboard data
            await fetchDashboardData();
          } else {
            console.log('📊 Dashboard: Invalid token, redirecting to login');
            router.replace('/auth/login');
          }
        } else {
          console.log('📊 Dashboard: No token found, redirecting to login');
          router.replace('/auth/login');
        }
      }
    };

    checkAuth();
  }, [router]);

  if (!mounted || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
                  <p className="text-3xl font-bold text-black">
                    {dashboardData.loading ? '...' : dashboardData.totalCompanies.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Real-time data
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
                  <p className="text-3xl font-bold text-black">
                    {dashboardData.loading ? '...' : dashboardData.totalContacts.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Real-time data
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
                  <p className="text-3xl font-bold text-black">
                    {dashboardData.loading ? '...' : dashboardData.activeDeals.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    In pipeline
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
                  <p className="text-3xl font-bold text-black">
                    {dashboardData.loading ? '...' : `$${dashboardData.totalRevenue.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    From closed deals
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
              {dashboardData.loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading activities...</p>
                </div>
              ) : dashboardData.recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentActivities.map((activity: any) => (
                    <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.type} • {new Date(activity.scheduledDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        activity.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No recent activities</p>
                  <p className="text-sm text-gray-400 mt-1">Activities will appear here when you start using the system</p>
                </div>
              )}
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
                <button 
                  onClick={() => router.push('/companies')}
                  className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-black mr-3" />
                    <div>
                      <p className="font-semibold text-black">Manage Companies</p>
                      <p className="text-sm text-gray-600">View and manage company records</p>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => router.push('/contacts')}
                  className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-black mr-3" />
                    <div>
                      <p className="font-semibold text-black">View Contacts</p>
                      <p className="text-sm text-gray-600">Manage contact records</p>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => router.push('/deals')}
                  className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-black mr-3" />
                    <div>
                      <p className="font-semibold text-black">Track Deals</p>
                      <p className="text-sm text-gray-600">View and manage deals pipeline</p>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => router.push('/activities')}
                  className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-black mr-3" />
                    <div>
                      <p className="font-semibold text-black">Activities</p>
                      <p className="text-sm text-gray-600">Schedule and track activities</p>
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
