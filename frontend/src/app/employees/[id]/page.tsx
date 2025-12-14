"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeePerformanceApi } from "@/lib/api/employee-management";
import { getStoredUser } from "@/lib/auth-utils";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowLeft,
  Award,
  Target,
  TrendingUp,
  Clock,
  Edit,
  RefreshCw,
  CheckCircle2,
  Calendar,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const employeeId = params?.id as string;

  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [workCapacity, setWorkCapacity] = useState(0);
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewNotes, setReviewNotes] = useState("");

  // Check authorization
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
    }
  }, [router]);

  // Fetch employee performance
  const { data: performanceResponse, isLoading } = useQuery({
    queryKey: ["employee-performance", employeeId],
    queryFn: async () => {
      const response = await employeePerformanceApi.getEmployeePerformance(
        employeeId
      );
      return response.data;
    },
    enabled: !!employeeId,
  });

  const performance = performanceResponse;

  // Fetch employee task history
  const { data: tasksResponse } = useQuery({
    queryKey: ["employee-tasks", employeeId],
    queryFn: async () => {
      const response = await employeePerformanceApi.getEmployeeTaskHistory(
        employeeId
      );
      return response.data;
    },
    enabled: !!employeeId,
  });

  const tasks = tasksResponse || [];

  // Initialize skills and capacity when data loads
  useEffect(() => {
    if (performance) {
      setSkillTags(performance.skillTags || []);
      setWorkCapacity(performance.workCapacity || 0);
    }
  }, [performance]);

  // Update skills mutation
  const updateSkillsMutation = useMutation({
    mutationFn: (skills: string[]) =>
      employeePerformanceApi.updateSkills(employeeId, skills),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employee-performance", employeeId],
      });
      toast.success("Skills updated successfully");
      setShowSkillsModal(false);
    },
    onError: () => {
      toast.error("Failed to update skills");
    },
  });

  // Update capacity mutation
  const updateCapacityMutation = useMutation({
    mutationFn: (capacity: number) =>
      employeePerformanceApi.updateCapacity(employeeId, capacity),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employee-performance", employeeId],
      });
      toast.success("Work capacity updated successfully");
      setShowCapacityModal(false);
    },
    onError: () => {
      toast.error("Failed to update capacity");
    },
  });

  // Create performance review mutation
  const createReviewMutation = useMutation({
    mutationFn: (data: { score: number; notes: string }) =>
      employeePerformanceApi.createPerformanceReview(employeeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employee-performance", employeeId],
      });
      toast.success("Performance review created successfully");
      setShowReviewModal(false);
      setReviewScore(0);
      setReviewNotes("");
    },
    onError: () => {
      toast.error("Failed to create review");
    },
  });

  // Recalculate score mutation
  const recalculateMutation = useMutation({
    mutationFn: () => employeePerformanceApi.recalculateScore(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employee-performance", employeeId],
      });
      toast.success("Performance score recalculated");
    },
    onError: () => {
      toast.error("Failed to recalculate score");
    },
  });

  const handleAddSkill = () => {
    if (newSkill.trim() && !skillTags.includes(newSkill.trim())) {
      setSkillTags([...skillTags, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkillTags(skillTags.filter((s) => s !== skill));
  };

  const handleSaveSkills = () => {
    updateSkillsMutation.mutate(skillTags);
  };

  const handleSaveCapacity = () => {
    updateCapacityMutation.mutate(workCapacity);
  };

  const handleCreateReview = () => {
    if (reviewScore < 0 || reviewScore > 100) {
      toast.error("Score must be between 0 and 100");
      return;
    }
    createReviewMutation.mutate({ score: reviewScore, notes: reviewNotes });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
          <div className="text-center py-12">Loading employee data...</div>
        </div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center py-12">Employee not found</div>
        </div>
      </div>
    );
  }

  const tier = getPerformanceTier(performance.performanceScore);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {performance.name}
            </h1>
            <p className="text-gray-600 mb-2">{performance.email}</p>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{performance.role}</Badge>
              <span className={`font-medium ${tier.color}`}>{tier.label}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Performance Score</p>
            <p className="text-5xl font-bold text-blue-600">
              {performance.performanceScore.toFixed(1)}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => recalculateMutation.mutate()}
              disabled={recalculateMutation.isPending}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${
                  recalculateMutation.isPending ? "animate-spin" : ""
                }`}
              />
              Recalculate
            </Button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {performance.completionRate.toFixed(0)}%
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
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
                    {performance.onTimeCompletionRate.toFixed(0)}%
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Workload</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {performance.currentWorkload}/{performance.workCapacity}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setShowCapacityModal(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Capacity
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Time</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {performance.averageCompletionTime
                      ? `${performance.averageCompletionTime.toFixed(1)}h`
                      : "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Skills & Actions */}
          <div className="space-y-6">
            {/* Skills */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Skills</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSkillsModal(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {performance.skillTags && performance.skillTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {performance.skillTags.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No skills added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tasks Completed</span>
                  <span className="font-semibold">
                    {performance.totalTasksCompleted}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tasks Assigned</span>
                  <span className="font-semibold">
                    {performance.totalTasksAssigned}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Utilization Rate
                  </span>
                  <span className="font-semibold">
                    {performance.utilizationRate.toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Manager Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manager Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowReviewModal(true)}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Create Performance Review
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/tasks?assignedTo=${employeeId}`)}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Assign New Task
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Task History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Task History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.length > 0 ? (
                    tasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(task.status)}
                          >
                            {task.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {task.scheduledDate
                              ? new Date(
                                  task.scheduledDate
                                ).toLocaleDateString()
                              : "No date"}
                          </div>
                          {task.assignedBy && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              Assigned by {task.assignedBy.name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No tasks found
                    </p>
                  )}
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
        title="Edit Skills"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Skill
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                placeholder="e.g. JavaScript, Leadership"
              />
              <Button onClick={handleAddSkill}>Add</Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {skillTags.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowSkillsModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveSkills}
              disabled={updateSkillsMutation.isPending}
            >
              {updateSkillsMutation.isPending ? "Saving..." : "Save Skills"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Capacity Modal */}
      <Modal
        isOpen={showCapacityModal}
        onClose={() => setShowCapacityModal(false)}
        title="Edit Work Capacity"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Capacity
            </label>
            <input
              type="number"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={workCapacity}
              onChange={(e) => setWorkCapacity(parseInt(e.target.value) || 0)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Current workload: {performance.currentWorkload}
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCapacityModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveCapacity}
              disabled={updateCapacityMutation.isPending}
            >
              {updateCapacityMutation.isPending ? "Saving..." : "Save Capacity"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Performance Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Create Performance Review"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Score (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={reviewScore}
              onChange={(e) => setReviewScore(parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Performance review notes..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowReviewModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateReview}
              disabled={createReviewMutation.isPending}
            >
              {createReviewMutation.isPending ? "Creating..." : "Create Review"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
