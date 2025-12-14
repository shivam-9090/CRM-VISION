"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tasksApi,
  employeePerformanceApi,
} from "@/lib/api/employee-management";
import { getStoredUser } from "@/lib/auth-utils";
import {
  calculateTaskScore,
  isOnTime,
  getPerformanceTier,
  getPerformanceColor,
} from "@/lib/score-system";
import { sendNotification } from "@/lib/notification-system";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Calendar,
  Award,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  completedAt: string | null;
  actualHours: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  performanceScore: number;
}

export default function AssignTasksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [verifyData, setVerifyData] = useState({
    approved: true,
    score: 10,
    feedback: "",
  });

  const [assignmentData, setAssignmentData] = useState({
    employeeId: "",
    taskTitle: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    frequency: "once", // once, daily, weekly, monthly
  });

  useEffect(() => {
    const storedUser = getStoredUser();
    if (
      !storedUser ||
      (storedUser.role !== "MANAGER" && storedUser.role !== "ADMIN")
    ) {
      router.push("/dashboard");
      return;
    }
    setUser(storedUser);
  }, [router]);

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ["employees-for-assignment"],
    queryFn: async () => {
      const response = await employeePerformanceApi.getEmployees();
      return (response.data as any)?.data || [];
    },
  });

  // Fetch tasks awaiting verification
  const { data: tasksAwaitingVerification } = useQuery({
    queryKey: ["tasks-verification"],
    queryFn: async () => {
      const response = await tasksApi.getTasks({ status: "REVIEW" });
      return (response.data as any)?.data || [];
    },
  });

  // Assign task mutation
  const assignTaskMutation = useMutation({
    mutationFn: async (data: typeof assignmentData) => {
      return tasksApi.createTask({
        title: data.taskTitle,
        description: data.description,
        type: "GENERAL",
        priority: data.priority,
        dueDate: data.dueDate,
        companyId: user?.companyId,
        assignedToId: data.employeeId,
      });
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks-verification"] });

      // Send notification to assigned employee
      const assignedEmployee = employees?.find(
        (emp: Employee) => emp.id === variables.employeeId
      );
      if (assignedEmployee) {
        sendNotification(assignedEmployee.id, "task_assigned", {
          taskTitle: variables.taskTitle,
          managerName: user?.name || "Manager",
          taskId: response?.data?.id,
        });
      }

      toast.success(
        `Task "${variables.taskTitle}" assigned to ${assignedEmployee?.name}`
      );
      setShowAssignModal(false);
      setAssignmentData({
        employeeId: "",
        taskTitle: "",
        description: "",
        priority: "MEDIUM",
        dueDate: "",
        frequency: "once",
      });
    },
    onError: () => {
      toast.error("Failed to assign task");
    },
  });

  // Verify task completion mutation
  const verifyTaskMutation = useMutation({
    mutationFn: async (data: typeof verifyData) => {
      if (!selectedTask) throw new Error("No task selected");
      // In a real app, this would call a verification endpoint
      // For now, we'll just update the status
      return tasksApi.updateStatus(selectedTask.id, "COMPLETED");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-verification"] });

      // Send notification to employee
      if (selectedTask?.assignedTo?.id) {
        if (verifyData.approved) {
          sendNotification(selectedTask.assignedTo.id, "task_verified", {
            taskTitle: selectedTask.title,
            points: verifyData.score,
            feedback: verifyData.feedback,
            approved: true,
            taskId: selectedTask.id,
          });
        } else {
          sendNotification(selectedTask.assignedTo.id, "task_verified", {
            taskTitle: selectedTask.title,
            feedback: verifyData.feedback,
            approved: false,
            taskId: selectedTask.id,
          });
        }
      }

      toast.success(
        verifyData.approved
          ? `Task approved! +${verifyData.score} points awarded to ${selectedTask?.assignedTo?.name}`
          : `Task rejected. ${selectedTask?.assignedTo?.name} will be notified.`
      );
      setShowVerifyModal(false);
      setSelectedTask(null);
    },
    onError: () => {
      toast.error("Failed to verify task");
    },
  });

  const getTasksPendingVerificationCount = () => {
    return tasksAwaitingVerification?.length || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REVIEW":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center mt-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== "MANAGER" && user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-semibold">
                Access Denied. Manager privileges required.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Employee Tasks
          </h1>
          <p className="text-gray-600">
            Assign tasks to employees and verify completions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Employees</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {employees?.length || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Awaiting Verification</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {getTasksPendingVerificationCount()}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setShowAssignModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Assign New Task
          </Button>
        </div>

        {/* Tasks Awaiting Verification */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Tasks Awaiting Verification ({getTasksPendingVerificationCount()})
          </h2>

          {tasksAwaitingVerification &&
          tasksAwaitingVerification.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">All tasks verified!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tasksAwaitingVerification?.map((task: Task) => (
                <Card
                  key={task.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {task.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {task.description}
                        </p>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="text-gray-600">Assigned to: </span>
                            <span className="font-medium">
                              {task.assignedTo?.name} ({task.assignedTo?.email})
                            </span>
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-600">
                              Actual Hours: {task.actualHours}h
                            </span>
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-600">
                              Completed:{" "}
                              {new Date(
                                task.completedAt || ""
                              ).toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => {
                          setSelectedTask(task);
                          setVerifyData({
                            approved: true,
                            score: 10,
                            feedback: "",
                          });
                          setShowVerifyModal(true);
                        }}
                      >
                        Review & Verify
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign Task Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setAssignmentData({
            employeeId: "",
            taskTitle: "",
            description: "",
            priority: "MEDIUM",
            dueDate: "",
            frequency: "once",
          });
        }}
        title="Assign Task to Employee"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={assignmentData.employeeId}
              onChange={(e) =>
                setAssignmentData({
                  ...assignmentData,
                  employeeId: e.target.value,
                })
              }
            >
              <option value="">Select employee</option>
              {employees?.map((emp: Employee) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Review Client Proposal"
              value={assignmentData.taskTitle}
              onChange={(e) =>
                setAssignmentData({
                  ...assignmentData,
                  taskTitle: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Task details and requirements"
              value={assignmentData.description}
              onChange={(e) =>
                setAssignmentData({
                  ...assignmentData,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={assignmentData.priority}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    priority: e.target.value,
                  })
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={assignmentData.frequency}
                onChange={(e) =>
                  setAssignmentData({
                    ...assignmentData,
                    frequency: e.target.value,
                  })
                }
              >
                <option value="once">Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={assignmentData.dueDate}
              onChange={(e) =>
                setAssignmentData({
                  ...assignmentData,
                  dueDate: e.target.value,
                })
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => assignTaskMutation.mutate(assignmentData)}
              disabled={
                assignTaskMutation.isPending ||
                !assignmentData.employeeId ||
                !assignmentData.taskTitle ||
                !assignmentData.dueDate
              }
            >
              {assignTaskMutation.isPending ? "Assigning..." : "Assign Task"}
            </Button>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Verify Task Modal */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setSelectedTask(null);
        }}
        title="Verify Task Completion"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                {selectedTask.title}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {selectedTask.description}
              </p>
              <p className="text-sm">
                <span className="font-medium">Completed by: </span>
                {selectedTask.assignedTo?.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Actual Hours: </span>
                {selectedTask.actualHours}h
              </p>
            </div>

            <div>
              <label className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={verifyData.approved}
                  onChange={(e) =>
                    setVerifyData({
                      ...verifyData,
                      approved: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Approve this task
                </span>
              </label>
            </div>

            {verifyData.approved && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score Breakdown
                  </label>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Base Points:</span>
                      <span className="font-medium text-gray-900">+10</span>
                    </div>
                    {selectedTask &&
                    isOnTime(
                      selectedTask.id,
                      selectedTask.completedAt || ""
                    ) ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">On-Time Bonus:</span>
                        <span className="font-medium text-green-600">+5</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Late Completion:</span>
                        <span className="font-medium text-red-600">-3</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                      <span className="text-gray-700 font-medium">
                        Quality Rating (1-5):
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => {
                              const baseScore = 10;
                              const bonusScore =
                                selectedTask &&
                                isOnTime(
                                  selectedTask.id,
                                  selectedTask.completedAt || ""
                                )
                                  ? 5
                                  : -3;
                              const qualityScore = Math.floor(
                                (rating / 5) * 10
                              );
                              setVerifyData({
                                ...verifyData,
                                score: baseScore + bonusScore + qualityScore,
                              });
                            }}
                            className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                              calculateTaskScore({
                                completed: true,
                                onTime:
                                  selectedTask &&
                                  isOnTime(
                                    selectedTask.id,
                                    selectedTask.completedAt || ""
                                  ),
                                qualityRating: rating,
                              }) ===
                              calculateTaskScore({
                                completed: true,
                                onTime:
                                  selectedTask &&
                                  isOnTime(
                                    selectedTask.id,
                                    selectedTask.completedAt || ""
                                  ),
                                qualityRating: Math.floor(
                                  (verifyData.score -
                                    10 -
                                    (selectedTask &&
                                    isOnTime(
                                      selectedTask.id,
                                      selectedTask.completedAt || ""
                                    )
                                      ? 5
                                      : -3)) /
                                    2.5
                                ),
                              })
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                      <span className="text-gray-900 font-bold">
                        Total Score:
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {verifyData.score} points
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manual Points Adjustment (optional)
                  </label>
                  <input
                    type="number"
                    min="-50"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., +5 for exceptional work"
                    onChange={(e) => {
                      const adjustment = parseInt(e.target.value) || 0;
                      const baseScore = calculateTaskScore({
                        completed: true,
                        onTime:
                          selectedTask &&
                          isOnTime(
                            selectedTask.id,
                            selectedTask.completedAt || ""
                          ),
                      });
                      setVerifyData({
                        ...verifyData,
                        score: Math.max(
                          0,
                          Math.min(100, baseScore + adjustment)
                        ),
                      });
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback for Employee
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Provide constructive feedback..."
                value={verifyData.feedback}
                onChange={(e) =>
                  setVerifyData({ ...verifyData, feedback: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => verifyTaskMutation.mutate(verifyData)}
                disabled={verifyTaskMutation.isPending}
                className={
                  verifyData.approved
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {verifyTaskMutation.isPending
                  ? "Verifying..."
                  : verifyData.approved
                  ? "Approve & Award Points"
                  : "Reject Task"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerifyModal(false);
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
