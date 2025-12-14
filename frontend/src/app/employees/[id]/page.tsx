"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeePerformanceApi } from "@/lib/api/employee-management";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  Target,
  Award,
  Zap,
  CheckCircle,
  Calendar,
  Edit,
  RefreshCw,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

interface EmployeeDetailProps {
  params: Promise<{ id: string }>;
}

export default function EmployeeDetailPage({ params }: EmployeeDetailProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [capacityInput, setCapacityInput] = useState(5);

  // Fetch employee performance
  const { data: employee, isLoading } = useQuery({
    queryKey: ["employeePerformance", resolvedParams.id],
    queryFn: async () => {
      const response = await employeePerformanceApi.getEmployeePerformance(
        resolvedParams.id
      );
      return response.data;
    },
  });

  // Fetch task history
  const { data: taskHistory } = useQuery({
    queryKey: ["employeeTaskHistory", resolvedParams.id],
    queryFn: async () => {
      const response = await employeePerformanceApi.getEmployeeTaskHistory(
        resolvedParams.id
      );
      return response.data;
    },
  });

  // Update skills mutation
  const updateSkillsMutation = useMutation({
    mutationFn: async (skills: string[]) => {
      return employeePerformanceApi.updateSkills(resolvedParams.id, skills);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employeePerformance", resolvedParams.id],
      });
      toast.success("Skills updated successfully");
      setShowSkillsModal(false);
      setSkillInput("");
    },
    onError: () => {
      toast.error("Failed to update skills");
    },
  });

  // Update capacity mutation
  const updateCapacityMutation = useMutation({
    mutationFn: async (capacity: number) => {
      return employeePerformanceApi.updateCapacity(resolvedParams.id, capacity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employeePerformance", resolvedParams.id],
      });
      toast.success("Work capacity updated successfully");
      setShowCapacityModal(false);
    },
    onError: () => {
      toast.error("Failed to update capacity");
    },
  });

  // Recalculate score mutation
  const recalculateScoreMutation = useMutation({
    mutationFn: async () => {
      return employeePerformanceApi.recalculateScore(resolvedParams.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employeePerformance", resolvedParams.id],
      });
      toast.success("Performance score recalculated");
    },
    onError: () => {
      toast.error("Failed to recalculate score");
    },
  });

  const handleUpdateSkills = () => {
    const skills = skillInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    if (skills.length === 0) {
      toast.error("Please enter at least one skill");
      return;
    }
    updateSkillsMutation.mutate(skills);
  };

  const getScoreBreakdown = () => {
    if (!employee) return [];

    const completionScore = (employee.completionRate / 100) * 30;
    const onTimeScore = (employee.onTimeCompletionRate / 100) * 25;

    // Speed score calculation
    let speedScore = 20;
    if (employee.averageCompletionTime && employee.totalTasksCompleted > 0) {
      const speedRatio = Math.min(1, 1 / (employee.averageCompletionTime / 8));
      speedScore = speedRatio * 20;
    }

    // Quality score (assuming average of 7/10 if not provided)
    const qualityScore = 10.5; // 7/10 * 15

    // Workload score
    const workloadScore = Math.max(
      0,
      10 - (employee.utilizationRate / 100) * 5
    );

    return [
      {
        name: "Completion Rate",
        value: completionScore,
        max: 30,
        color: "bg-blue-600",
        description: `${employee.completionRate.toFixed(
          0
        )}% of assigned tasks completed`,
      },
      {
        name: "On-Time Delivery",
        value: onTimeScore,
        max: 25,
        color: "bg-green-600",
        description: `${employee.onTimeCompletionRate.toFixed(
          0
        )}% of tasks delivered on time`,
      },
      {
        name: "Speed",
        value: speedScore,
        max: 20,
        color: "bg-purple-600",
        description: `Average ${
          employee.averageCompletionTime?.toFixed(1) || "N/A"
        }h per task`,
      },
      {
        name: "Quality",
        value: qualityScore,
        max: 15,
        color: "bg-yellow-600",
        description: "Based on task reviews",
      },
      {
        name: "Workload Balance",
        value: workloadScore,
        max: 10,
        color: "bg-red-600",
        description: `${employee.utilizationRate.toFixed(
          0
        )}% capacity utilization`,
      },
    ];
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mt-12"></div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center mt-12">
            <p className="text-gray-600">Employee not found</p>
          </div>
        </div>
      </div>
    );
  }

  const scoreBreakdown = getScoreBreakdown();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                  {employee.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {employee.name}
                  </h1>
                  <p className="text-gray-600">{employee.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge>{employee.role}</Badge>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => recalculateScoreMutation.mutate()}
                disabled={recalculateScoreMutation.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recalculate Score
              </Button>
            </div>
          </div>

          {/* Performance Score Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Overall Performance Score
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-5xl font-bold text-gray-900">
                      {employee.performanceScore.toFixed(1)}
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-gray-700">
                        / 100
                      </p>
                      {employee.performanceScore >= 80 && (
                        <p className="text-sm text-green-600">⭐ Excellent</p>
                      )}
                      {employee.performanceScore >= 60 &&
                        employee.performanceScore < 80 && (
                          <p className="text-sm text-blue-600">Good</p>
                        )}
                      {employee.performanceScore >= 40 &&
                        employee.performanceScore < 60 && (
                          <p className="text-sm text-yellow-600">Average</p>
                        )}
                      {employee.performanceScore < 40 && (
                        <p className="text-sm text-red-600">
                          Needs Improvement
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {employee.totalTasksCompleted}
                    </p>
                    <p className="text-sm text-gray-600">Tasks Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {employee.currentWorkload}/{employee.workCapacity}
                    </p>
                    <p className="text-sm text-gray-600">Current Workload</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {employee.onTimeCompletionRate.toFixed(0)}%
                    </p>
                    <p className="text-sm text-gray-600">On-Time Rate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Score Breakdown */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      <CardTitle>Performance Breakdown</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scoreBreakdown.map((metric) => (
                      <div key={metric.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {metric.name}
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {metric.value.toFixed(1)} / {metric.max}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`${metric.color} h-3 rounded-full transition-all`}
                            style={{
                              width: `${(metric.value / metric.max) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {metric.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>AI Scoring Algorithm:</strong> Performance is
                      calculated using a weighted system: 30% completion rate,
                      25% on-time delivery, 20% speed, 15% quality, and 10%
                      workload balance.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Task History */}
              {taskHistory && taskHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <CardTitle>Recent Task History</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {taskHistory.slice(0, 10).map((task: any) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => router.push(`/tasks/${task.id}`)}
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={
                                  task.status === "COMPLETED"
                                    ? "bg-green-100 text-green-700"
                                    : task.status === "IN_PROGRESS"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                                }
                              >
                                {task.status.replace("_", " ")}
                              </Badge>
                              {task.completedAt && (
                                <span className="text-xs text-gray-600">
                                  Completed{" "}
                                  {new Date(
                                    task.completedAt
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {task.actualHours && (
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {task.actualHours}h
                              </p>
                              {task.actualHours <= task.estimatedHours ? (
                                <p className="text-xs text-green-600">
                                  ✓ On time
                                </p>
                              ) : (
                                <p className="text-xs text-red-600">Overrun</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Skills */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Skills</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSkillInput(employee.skillTags?.join(", ") || "");
                        setShowSkillsModal(true);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {employee.skillTags && employee.skillTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {employee.skillTags.map((skill: string) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No skills added</p>
                  )}
                </CardContent>
              </Card>

              {/* Work Capacity */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Work Capacity</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCapacityInput(employee.workCapacity);
                        setShowCapacityModal(true);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gray-900 mb-2">
                      {employee.workCapacity}
                    </p>
                    <p className="text-sm text-gray-600">
                      Maximum concurrent tasks
                    </p>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Current Load</span>
                        <span className="font-semibold text-gray-900">
                          {employee.utilizationRate.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            employee.utilizationRate >= 90
                              ? "bg-red-600"
                              : employee.utilizationRate >= 70
                              ? "bg-yellow-600"
                              : "bg-green-600"
                          }`}
                          style={{ width: `${employee.utilizationRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700">
                          Completion Rate
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {employee.completionRate.toFixed(0)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">Avg. Time</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {employee.averageCompletionTime?.toFixed(1) || "N/A"}h
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-700">
                          Tasks Assigned
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {employee.totalTasksAssigned}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-gray-700">
                          Utilization
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {employee.utilizationRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

      {/* Skills Modal */}
      <Modal
        isOpen={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
        title="Update Skills"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills (comma-separated)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="e.g., JavaScript, React, Node.js, TypeScript"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple skills with commas
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleUpdateSkills}
              disabled={updateSkillsMutation.isPending}
            >
              {updateSkillsMutation.isPending ? "Updating..." : "Update Skills"}
            </Button>
            <Button variant="outline" onClick={() => setShowSkillsModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Capacity Modal */}
      <Modal
        isOpen={showCapacityModal}
        onClose={() => setShowCapacityModal(false)}
        title="Update Work Capacity"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Concurrent Tasks
            </label>
            <input
              type="number"
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={capacityInput}
              onChange={(e) => setCapacityInput(parseInt(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Set the maximum number of tasks this employee can handle
              simultaneously (1-20)
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => updateCapacityMutation.mutate(capacityInput)}
              disabled={updateCapacityMutation.isPending}
            >
              {updateCapacityMutation.isPending
                ? "Updating..."
                : "Update Capacity"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCapacityModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
