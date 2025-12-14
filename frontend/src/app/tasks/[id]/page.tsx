"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/employee-management";
import { getStoredUser } from "@/lib/auth-utils";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Play,
  CheckCircle,
  AlertCircle,
  History,
  Tag,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface TaskDetailProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: TaskDetailProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [actualHours, setActualHours] = useState<number>(0);
  const [qualityScore, setQualityScore] = useState<number>(5);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
  }, []);

  // Fetch task details
  const { data: task, isLoading } = useQuery({
    queryKey: ["task", resolvedParams.id],
    queryFn: async () => {
      const response = await tasksApi.getTask(resolvedParams.id);
      return response.data;
    },
  });

  // Fetch task history
  const { data: history } = useQuery({
    queryKey: ["taskHistory", resolvedParams.id],
    queryFn: async () => {
      const response = await tasksApi.getTaskHistory(resolvedParams.id);
      return response.data;
    },
  });

  // Start task mutation
  const startTaskMutation = useMutation({
    mutationFn: async () => {
      return tasksApi.startTask(resolvedParams.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", resolvedParams.id] });
      queryClient.invalidateQueries({
        queryKey: ["taskHistory", resolvedParams.id],
      });
      toast.success("Task started");
    },
    onError: () => {
      toast.error("Failed to start task");
    },
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      return tasksApi.completeTask(resolvedParams.id, {
        actualHours,
        qualityScore,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", resolvedParams.id] });
      queryClient.invalidateQueries({
        queryKey: ["taskHistory", resolvedParams.id],
      });
      toast.success("Task completed");
    },
    onError: () => {
      toast.error("Failed to complete task");
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return tasksApi.updateStatus(resolvedParams.id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", resolvedParams.id] });
      queryClient.invalidateQueries({
        queryKey: ["taskHistory", resolvedParams.id],
      });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-700 border-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "LOW":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-700";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "BLOCKED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const canManageTask =
    user && (user.role === "MANAGER" || user.role === "ADMIN");
  const isAssignedUser = user && task?.assignedTo?.id === user.id;

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

  if (!task) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center mt-12">
            <p className="text-gray-600">Task not found</p>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {task.title}
              </h1>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-sm rounded-full border ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace("_", " ")}
                </Badge>
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                  {task.taskType}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {isAssignedUser && task.status === "TODO" && (
                <Button
                  onClick={() => startTaskMutation.mutate()}
                  disabled={startTaskMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Task
                </Button>
              )}

              {isAssignedUser && task.status === "IN_PROGRESS" && (
                <Button
                  onClick={() => {
                    if (!actualHours) {
                      toast.error("Please enter actual hours worked");
                      return;
                    }
                    completeTaskMutation.mutate();
                  }}
                  disabled={completeTaskMutation.isPending}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete Task
                </Button>
              )}

              {canManageTask && task.status === "BLOCKED" && (
                <Button
                  onClick={() => updateStatusMutation.mutate("TODO")}
                  disabled={updateStatusMutation.isPending}
                >
                  Unblock Task
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <CardTitle>Description</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {task.description || "No description provided"}
                </p>
              </CardContent>
            </Card>

            {/* Completion Details (for IN_PROGRESS tasks) */}
            {isAssignedUser && task.status === "IN_PROGRESS" && (
              <Card>
                <CardHeader>
                  <CardTitle>Completion Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Actual Hours Worked *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={actualHours}
                        onChange={(e) =>
                          setActualHours(parseFloat(e.target.value))
                        }
                        placeholder="e.g., 8.5"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Estimated: {task.estimatedHours} hours
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quality Score (1-10)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          className="flex-1"
                          value={qualityScore}
                          onChange={(e) =>
                            setQualityScore(parseInt(e.target.value))
                          }
                        />
                        <span className="text-lg font-bold text-gray-900 w-8">
                          {qualityScore}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Poor</span>
                        <span>Average</span>
                        <span>Excellent</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Task History */}
            {history && history.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    <CardTitle>Task History</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {history.map((entry: any) => (
                      <div key={entry.id} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {entry.action}
                              </p>
                              <p className="text-sm text-gray-600">
                                by {entry.user?.name || "System"}
                              </p>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {entry.changes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(entry.changes, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Created By</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center text-sm">
                        {task.createdBy?.name?.charAt(0) || "S"}
                      </div>
                      <span className="font-medium text-gray-900">
                        {task.createdBy?.name || "System"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Assigned To</p>
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
                          {task.assignedTo.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {task.assignedTo.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {task.assignedTo.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">Unassigned</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700 mb-3">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        Estimated: {task.estimatedHours} hours
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    {task.startedAt && (
                      <div className="flex items-center gap-2 text-gray-700 mb-3">
                        <Play className="w-4 h-4" />
                        <span className="text-sm">
                          Started: {new Date(task.startedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {task.completedAt && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">
                          Completed:{" "}
                          {new Date(task.completedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {task.actualHours && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Actual Hours</p>
                      <p className="text-lg font-bold text-gray-900">
                        {task.actualHours} hours
                      </p>
                      {task.estimatedHours && (
                        <p className="text-xs text-gray-500">
                          {task.actualHours <= task.estimatedHours ? (
                            <span className="text-green-600">
                              ✓ Within estimate
                            </span>
                          ) : (
                            <span className="text-red-600">
                              {(
                                ((task.actualHours - task.estimatedHours) /
                                  task.estimatedHours) *
                                100
                              ).toFixed(0)}
                              % over estimate
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {task.qualityScore && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Quality Score
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${task.qualityScore * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {task.qualityScore}/10
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status Actions */}
            {canManageTask && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {task.status !== "TODO" && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => updateStatusMutation.mutate("TODO")}
                        disabled={updateStatusMutation.isPending}
                      >
                        Move to To Do
                      </Button>
                    )}
                    {task.status !== "IN_PROGRESS" && task.assignedTo && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          updateStatusMutation.mutate("IN_PROGRESS")
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        Move to In Progress
                      </Button>
                    )}
                    {task.status !== "BLOCKED" && (
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => updateStatusMutation.mutate("BLOCKED")}
                        disabled={updateStatusMutation.isPending}
                      >
                        <AlertCircle className="w-4 h-4" />
                        Mark as Blocked
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
