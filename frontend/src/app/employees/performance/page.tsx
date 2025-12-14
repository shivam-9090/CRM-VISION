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
  Target,
  ChevronRight,
  Search,
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
    data: employeesResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await employeePerformanceApi.getEmployees();
      // Handle both array and paginated response formats
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data.data || [];
    },
  });

  const employees: Employee[] = Array.isArray(employeesResponse) ? employeesResponse : [];

  // Fetch leaderboard
  const { data: leaderboardResponse } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const response = await employeePerformanceApi.getLeaderboard(
        undefined,
        5
      );
      return response.data;
    },
  });

  const leaderboard = leaderboardResponse || [];

  // Filter and sort employees
  const filteredEmployees = employees
    .filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.performanceScore - a.performanceScore;
        case "name":
          return a.name.localeCompare(b.name);
        case "workload":
          return b.currentWorkload - a.currentWorkload;
        default:
          return 0;
      }
    });

  // Calculate overall stats
  const overallStats = {
    totalEmployees: employees.length,
    averageScore:
      employees.reduce((sum, emp) => sum + emp.performanceScore, 0) /
        (employees.length || 1) || 0,
    totalTasksCompleted:
      employees.reduce((sum, emp) => sum + emp.totalTasksCompleted, 0) || 0,
    averageOnTimeRate:
      employees.reduce((sum, emp) => sum + emp.onTimeCompletionRate, 0) /
        (employees.length || 1) || 0,
  };

  const getPerformanceTier = (score: number) => {
    if (score >= 80) return { label: "Elite", color: "text-purple-600" };
    if (score >= 60) return { label: "High Performer", color: "text-blue-600" };
    if (score >= 40) return { label: "Solid", color: "text-green-600" };
    if (score >= 20) return { label: "Developing", color: "text-yellow-600" };
    return { label: "Needs Improvement", color: "text-red-600" };
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center py-12">Loading performance data...</div>
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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Employee Performance
            </h1>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <p className="text-gray-600">
            Track and manage employee performance metrics
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.map((emp: any, index: number) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => router.push(`/employees/${emp.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0
                              ? "bg-yellow-500 text-white"
                              : index === 1
                              ? "bg-gray-400 text-white"
                              : index === 2
                              ? "bg-orange-500 text-white"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {emp.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Score: {emp.performanceScore.toFixed(1)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Employees</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(
                          e.target.value as "score" | "name" | "workload"
                        )
                      }
                    >
                      <option value="score">Sort by Score</option>
                      <option value="name">Sort by Name</option>
                      <option value="workload">Sort by Workload</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredEmployees.map((employee) => {
                    const tier = getPerformanceTier(employee.performanceScore);
                    return (
                      <div
                        key={employee.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => router.push(`/employees/${employee.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {employee.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {employee.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              {employee.performanceScore.toFixed(1)}
                            </p>
                            <p className={`text-xs ${tier.color}`}>
                              {tier.label}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-3">
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-xs text-gray-600">Workload</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {employee.currentWorkload}/{employee.workCapacity}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-xs text-gray-600">Completion</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {employee.completionRate.toFixed(0)}%
                            </p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-xs text-gray-600">On-Time</p>
                            <p className="text-sm font-semibold text-green-600">
                              {employee.onTimeCompletionRate.toFixed(0)}%
                            </p>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <p className="text-xs text-gray-600">Avg Time</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {employee.averageCompletionTime
                                ? `${employee.averageCompletionTime.toFixed(
                                    1
                                  )}h`
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        {employee.skillTags &&
                          employee.skillTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {employee.skillTags.slice(0, 5).map((skill) => (
                                <span
                                  key={skill}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
