"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { employeePerformanceApi } from "@/lib/api/employee-management";
import { getStoredUser } from "@/lib/auth-utils";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  TrendingUp,
  Award,
  Zap,
  Clock,
  Target,
  Star,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  performanceScore: number;
  skillTags: string[] | null;
  workCapacity: number;
  currentWorkload: number;
  totalTasksCompleted: number;
  totalTasksAssigned: number;
  onTimeCompletionRate: number;
  averageCompletionTime: number | null;
  utilizationRate: number;
  completionRate: number;
}

export default function EmployeePerformancePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "name" | "workload">("score");
  const [filterRole, setFilterRole] = useState<string>("all");

  // Check authorization
  useEffect(() => {
    const user = getStoredUser();
    if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN")) {
      toast.error("Access denied. Only managers can access this page.");
      router.push("/dashboard");
    }
  }, [router]);

  // Fetch employees
  const {
    data: employees,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await employeePerformanceApi.getEmployees();
      return (response.data as any)?.data || [];
    },
  });

  // Fetch leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const response = await employeePerformanceApi.getLeaderboard(
        undefined,
        5
      );
      return (response.data as any)?.data || [];
    },
  });

  // Filter and sort employees
  const filteredEmployees = employees
    ?.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === "all" || emp.role === filterRole;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (sortBy === "score") return b.performanceScore - a.performanceScore;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "workload") return b.currentWorkload - a.currentWorkload;
      return 0;
    });

  const getScoreBadge = (score: number) => {
    if (score >= 80)
      return { color: "green", label: "Excellent", icon: "⭐⭐⭐⭐⭐" };
    if (score >= 60) return { color: "blue", label: "Good", icon: "⭐⭐⭐⭐" };
    if (score >= 40)
      return { color: "yellow", label: "Average", icon: "⭐⭐⭐" };
    return { color: "red", label: "Needs Improvement", icon: "⭐⭐" };
  };

  const getWorkloadColor = (utilizationRate: number) => {
    if (utilizationRate >= 90) return "text-red-600";
    if (utilizationRate >= 70) return "text-yellow-600";
    if (utilizationRate >= 40) return "text-green-600";
    return "text-blue-600";
  };

  // Calculate overall stats
  const overallStats = {
    totalEmployees: employees?.length || 0,
    averageScore:
      employees?.reduce((sum, emp) => sum + emp.performanceScore, 0) /
        (employees?.length || 1) || 0,
    totalTasksCompleted:
      employees?.reduce((sum, emp) => sum + emp.totalTasksCompleted, 0) || 0,
    averageOnTimeRate:
      employees?.reduce((sum, emp) => sum + emp.onTimeCompletionRate, 0) /
        (employees?.length || 1) || 0,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Employee Performance
          </h1>
          <p className="text-gray-600">
            AI-powered performance tracking and analytics
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {overallStats.totalEmployees}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Score</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {overallStats.averageScore.toFixed(1)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tasks Completed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {overallStats.totalTasksCompleted}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">On-Time Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {overallStats.averageOnTimeRate.toFixed(0)}%
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <CardTitle>Top Performers</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((emp: any, index: number) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => router.push(`/employees/${emp.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : `#${index + 1}`}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {emp.name}
                        </p>
                        <p className="text-sm text-gray-600">{emp.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Score</p>
                        <p className="text-lg font-bold text-gray-900">
                          {emp.performanceScore.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">On-Time</p>
                        <p className="text-lg font-bold text-green-600">
                          {emp.onTimeCompletionRate.toFixed(0)}%
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="SALES">Sales</option>
                <option value="MANAGER">Manager</option>
              </select>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="score">Sort by Score</option>
                <option value="name">Sort by Name</option>
                <option value="workload">Sort by Workload</option>
              </select>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading employees...</p>
            </CardContent>
          </Card>
        ) : filteredEmployees && filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEmployees.map((employee) => {
              const scoreBadge = getScoreBadge(employee.performanceScore);
              return (
                <Card
                  key={employee.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/employees/${employee.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {employee.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {employee.email}
                        </p>
                        <Badge className="mt-2">{employee.role}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">
                          Performance
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {employee.performanceScore.toFixed(1)}
                          </span>
                          <Badge variant={scoreBadge.color as any}>
                            {scoreBadge.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {scoreBadge.icon}
                        </p>
                      </div>
                    </div>

                    {/* Skills */}
                    {employee.skillTags && employee.skillTags.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-2">Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {employee.skillTags.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {employee.skillTags.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              +{employee.skillTags.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-600">Workload</p>
                        <p
                          className={`text-lg font-semibold ${getWorkloadColor(
                            employee.utilizationRate
                          )}`}
                        >
                          {employee.currentWorkload}/{employee.workCapacity}
                        </p>
                        <p className="text-xs text-gray-500">
                          {employee.utilizationRate.toFixed(0)}% utilized
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Completion</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {employee.completionRate.toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {employee.totalTasksCompleted}/
                          {employee.totalTasksAssigned} tasks
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">On-Time Rate</p>
                        <p className="text-lg font-semibold text-green-600">
                          {employee.onTimeCompletionRate.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Avg Time</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {employee.averageCompletionTime
                            ? `${employee.averageCompletionTime.toFixed(1)}h`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No employees found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
