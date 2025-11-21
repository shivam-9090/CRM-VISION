"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { hasAuthToken, verifyAuthToken } from "@/lib/auth-utils";
import { queryKeys } from "@/lib/query-keys";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Building2,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
} from "lucide-react";
import api from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userName, setUserName] = useState<string>("");

  // Get user name from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.name || user.email || "User");
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  // Fetch dashboard data using React Query with automatic refetching
  const {
    data: dashboardData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: async () => {
      console.log("📊 Fetching dashboard data with React Query...");

      // Fetch all data in parallel
      const [companiesRes, contactsRes, pipelineStatsRes, activitiesRes] =
        await Promise.all([
          api.get("/companies"),
          api.get("/contacts"),
          api.get("/deals/stats/pipeline"),
          api.get("/activities"),
        ]);

      console.log("📊 Raw API responses:", {
        companies: companiesRes.data,
        contacts: contactsRes.data,
        pipelineStats: pipelineStatsRes.data,
      });

      // Calculate metrics - handle different response formats
      const companiesData = companiesRes.data.data || companiesRes.data || [];
      const contactsData = contactsRes.data.data || contactsRes.data || [];
      const totalCompanies = Array.isArray(companiesData)
        ? companiesData.length
        : 0;
      const totalContacts = Array.isArray(contactsData)
        ? contactsData.length
        : 0;

      // Use pipeline stats endpoint for accurate deal counts
      const pipelineStats = Array.isArray(pipelineStatsRes.data)
        ? pipelineStatsRes.data
        : [];

      // Calculate active deals (not CLOSED_WON or CLOSED_LOST) and total revenue
      let activeDeals = 0;
      let totalRevenue = 0;
      let wonDeals = 0;
      let lostDeals = 0;

      pipelineStats.forEach((stat: any) => {
        if (stat.stage === "CLOSED_WON") {
          totalRevenue += stat.totalValue || 0;
          wonDeals += stat.count || 0;
        } else if (stat.stage === "CLOSED_LOST") {
          lostDeals += stat.count || 0;
        } else {
          activeDeals += stat.count || 0;
        }
      });

      // Handle paginated activities response - get recent activities (last 5)
      const activitiesData =
        activitiesRes.data.data || activitiesRes.data || [];
      const recentActivities = Array.isArray(activitiesData)
        ? activitiesData.slice(0, 5)
        : [];

      console.log("📊 Dashboard data calculated:", {
        totalCompanies,
        totalContacts,
        activeDeals,
        wonDeals,
        lostDeals,
        totalRevenue: `$${totalRevenue.toLocaleString()}`,
        recentActivities: recentActivities.length,
      });

      return {
        totalCompanies,
        totalContacts,
        activeDeals,
        totalRevenue,
        wonDeals,
        lostDeals,
        recentActivities,
      };
    },
    enabled: isAuthorized, // Only fetch when authorized
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 0, // Don't cache data - always fetch fresh
  });

  useEffect(() => {
    setMounted(true);

    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        // Add debugging info
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        console.log("📊 Dashboard Auth Check:", {
          hasTokenInLS: !!token,
          hasUserInLS: !!user,
          tokenPreview: token ? token.substring(0, 20) + "..." : null,
        });

        // First do a quick local check
        const hasToken = hasAuthToken();

        if (hasToken) {
          console.log(
            "📊 Dashboard: Local token found, verifying with backend..."
          );
          // Verify with backend
          const isValid = await verifyAuthToken();

          if (isValid) {
            console.log("📊 Dashboard: Valid token, showing dashboard");
            setIsAuthorized(true);
            // Data will be fetched automatically by React Query
          } else {
            console.log("📊 Dashboard: Invalid token, redirecting to login");
            router.replace("/auth/login");
          }
        } else {
          console.log("📊 Dashboard: No token found, redirecting to login");
          router.replace("/auth/login");
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
      <div className="flex-1 p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2 animate-fade-in">
            Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Welcome back,{" "}
            <span className="font-semibold text-black">{userName}</span>!
            Here&apos;s what&apos;s happening with your CRM.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-gray-200 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Total Companies
                  </p>
                  <p className="text-3xl font-bold text-black">
                    {isLoading
                      ? "..."
                      : dashboardData?.totalCompanies.toLocaleString() || "0"}
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
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Total Contacts
                  </p>
                  <p className="text-3xl font-bold text-black">
                    {isLoading
                      ? "..."
                      : dashboardData?.totalContacts.toLocaleString() || "0"}
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
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Active Deals
                  </p>
                  <p className="text-3xl font-bold text-black">
                    {isLoading
                      ? "..."
                      : dashboardData?.activeDeals.toLocaleString() || "0"}
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
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold text-black">
                    {isLoading
                      ? "..."
                      : `$${
                          dashboardData?.totalRevenue.toLocaleString() || "0"
                        }`}
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
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading activities...</p>
                </div>
              ) : dashboardData?.recentActivities &&
                dashboardData.recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentActivities.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.type} •{" "}
                          {new Date(
                            activity.scheduledDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          activity.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : activity.status === "SCHEDULED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No recent activities
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Activities will appear here when you start using the system
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-black" />
                Deal Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[280px]">
                {isLoading ? (
                  <div className="text-gray-500">Loading...</div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Custom SVG Pie Chart */}
                    <svg
                      viewBox="0 0 200 200"
                      className="w-full h-full max-w-[200px]"
                    >
                      {(() => {
                        const wonCount = dashboardData?.wonDeals || 0;
                        const lostCount = dashboardData?.lostDeals || 0;
                        const activeCount = dashboardData?.activeDeals || 0;
                        const total = wonCount + lostCount + activeCount;

                        if (total === 0) {
                          return (
                            <circle cx="100" cy="100" r="80" fill="#e5e7eb" />
                          );
                        }

                        const wonPercent = (wonCount / total) * 100;
                        const lostPercent = (lostCount / total) * 100;
                        const activePercent = (activeCount / total) * 100;

                        // Create pie slices
                        let currentAngle = -90; // Start at top

                        const createSlice = (
                          percent: number,
                          color: string
                        ) => {
                          const angle = (percent / 100) * 360;
                          const startAngle = currentAngle;
                          const endAngle = currentAngle + angle;

                          currentAngle = endAngle;

                          const startX =
                            100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                          const startY =
                            100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                          const endX =
                            100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                          const endY =
                            100 + 80 * Math.sin((endAngle * Math.PI) / 180);

                          const largeArcFlag = angle > 180 ? 1 : 0;

                          return (
                            <path
                              d={`M 100 100 L ${startX} ${startY} A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                              fill={color}
                              stroke="#000000"
                              strokeWidth="2"
                            />
                          );
                        };

                        return (
                          <>
                            {wonPercent > 0 &&
                              createSlice(wonPercent, "#22c55e")}
                            {lostPercent > 0 &&
                              createSlice(lostPercent, "#ef4444")}
                            {activePercent > 0 &&
                              createSlice(activePercent, "#eab308")}
                          </>
                        );
                      })()}
                    </svg>

                    {/* Legend */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                        <span className="text-gray-700 font-medium">
                          Won ({dashboardData?.wonDeals || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                        <span className="text-gray-700 font-medium">
                          Lost ({dashboardData?.lostDeals || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                        <span className="text-gray-700 font-medium">
                          Active ({dashboardData?.activeDeals || 0})
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
