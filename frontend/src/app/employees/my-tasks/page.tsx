"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/employee-management";
import { getStoredUser } from "@/lib/auth-utils";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Clock, CheckCircle, AlertCircle, Award } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  taskType: string;
  estimatedHours: number;
  dueDate: string;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdBy: {
    name: string;
  };
  startedAt: string | null;
  completedAt: string | null;
  verificationFeedback?: string;
  pointsAwarded?: number;
}

export default function MyTasksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completionData, setCompletionData] = useState({
    actualHours: 1,
    notes: "",
  });

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push("/auth/login");
      return;
    }
    setUser(storedUser);
  }, [router]);

  // Fetch tasks assigned to this employee
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["my-tasks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Get all tasks and filter for ones assigned to this user
      const response = await tasksApi.getTasks({ assignedToId: user.id });
      return (response.data as any)?.data || [];
    },
    enabled: !!user?.id,
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async (data: typeof completionData) => {
      if (!selectedTask) throw new Error("No task selected");
      return tasksApi.completeTask(
        selectedTask.id,
        data.actualHours,
        data.notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success("Task submitted for verification");
      setShowCompleteModal(false);
      setSelectedTask(null);
      setCompletionData({ actualHours: 1, notes: "" });
    },
    onError: () => {
      toast.error("Failed to submit task");
    },
  });

  // Start task mutation
  const startTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return tasksApi.startTask(taskId, "Started by employee");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success("Task started");
    },
    onError: () => {
      toast.error("Failed to start task");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "REVIEW":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && dueDate;
  };

  const daysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center mt-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
          <p className="text-gray-600">
            Complete your assigned tasks and track your progress
          </p>
        </div>

        {/* Notification Banner for Verified Tasks */}
        {tasks && tasks.some((t: Task) => t.pointsAwarded) && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-1">
                    Task Verified! 🎉
                  </h4>
                  {tasks
                    .filter((t: Task) => t.pointsAwarded)
                    .map((t: Task) => (
                      <p key={t.id} className="text-sm text-green-700 mb-1">
                        <span className="font-medium">{t.title}</span> - You
                        earned{" "}
                        <span className="font-bold">{t.pointsAwarded}</span>{" "}
                        points!
                      </p>
                    ))}
                  {tasks.some((t: Task) => t.verificationFeedback) && (
                    <p className="text-sm text-green-600 mt-2 italic">
                      Manager feedback: "
                      {tasks.find((t: Task) => t.verificationFeedback)
                        ?.verificationFeedback || ""}
                      "
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {tasks && tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No tasks assigned yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks?.map((task: Task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {task.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {task.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {task.taskType}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Est. {task.estimatedHours}h
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-gray-600">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                      {isOverdue(task.dueDate) &&
                        task.status !== "COMPLETED" && (
                          <span className="text-xs font-semibold text-red-600">
                            OVERDUE
                          </span>
                        )}
                      {!isOverdue(task.dueDate) &&
                        task.status !== "COMPLETED" && (
                          <span className="text-xs text-gray-600">
                            {daysRemaining(task.dueDate)} days left
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {task.status === "PENDING" || task.status === "ASSIGNED" ? (
                      <>
                        <Button
                          onClick={() => startTaskMutation.mutate(task.id)}
                          disabled={startTaskMutation.isPending}
                        >
                          {startTaskMutation.isPending
                            ? "Starting..."
                            : "Start Task"}
                        </Button>
                      </>
                    ) : task.status === "IN_PROGRESS" ? (
                      <>
                        <Button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowCompleteModal(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                      </>
                    ) : task.status === "COMPLETED" ? (
                      <Button variant="outline" disabled>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Completed
                      </Button>
                    ) : task.status === "REVIEW" ? (
                      <Button variant="outline" disabled>
                        Awaiting Verification
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Complete Task Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          setSelectedTask(null);
          setCompletionData({ actualHours: 1, notes: "" });
        }}
        title="Complete Task"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {selectedTask.title}
              </h4>
              <p className="text-sm text-gray-600">
                {selectedTask.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Hours Spent *
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={completionData.actualHours}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    actualHours: parseFloat(e.target.value),
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Estimated: {selectedTask.estimatedHours} hours
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Completion Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="What did you accomplish? Any challenges?"
                value={completionData.notes}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    notes: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => completeTaskMutation.mutate(completionData)}
                disabled={completeTaskMutation.isPending}
              >
                {completeTaskMutation.isPending
                  ? "Submitting..."
                  : "Submit for Verification"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedTask(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
