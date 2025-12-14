"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tasksApi,
  workAssignmentApi,
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
  Filter,
  Search,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Circle,
  Play,
  Sparkles,
  Calendar,
  Tag,
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
}

interface EmployeeSuggestion {
  employee: {
    id: string;
    name: string;
    email: string;
    performanceScore: number;
    currentWorkload: number;
    workCapacity: number;
    skillTags: string[];
  };
  confidenceScore: number;
  reasoning: {
    performanceScore: number;
    availabilityScore: number;
    skillMatchScore: number;
    experienceScore: number;
  };
}

export default function TasksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"board" | "list" | "verification">(
    "board"
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<
    string | null
  >(null);
  const [selectedTaskForVerification, setSelectedTaskForVerification] =
    useState<Task | null>(null);
  const [verifyData, setVerifyData] = useState({
    approved: true,
    score: 10,
    feedback: "",
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    type: "GENERAL",
    priority: "MEDIUM",
    estimatedHours: 8,
    dueDate: "",
    companyId: "",
    assignedToId: "",
  });

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
  }, []);

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", statusFilter, priorityFilter, user?.id, user?.role],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;

      // If employee, only show their assigned tasks
      if (
        user?.role === "EMPLOYEE" ||
        user?.role === "SALES" ||
        user?.role === "USER"
      ) {
        params.assignedToId = user?.id;
      }

      const response = await tasksApi.getTasks(params);
      return (response.data as any)?.data || [];
    },
    enabled: !!user,
  });

  // Fetch employees for assignment
  const { data: employees } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const response = await employeePerformanceApi.getEmployees();
      return (response.data as any)?.data || [];
    },
  });

  // Fetch AI suggestions for selected task
  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ["suggestions", selectedTaskForAssignment],
    queryFn: async () => {
      if (!selectedTaskForAssignment) return [];
      const response = await workAssignmentApi.suggestEmployees(
        selectedTaskForAssignment
      );
      return (response.data as any)?.data || [];
    },
    enabled: !!selectedTaskForAssignment,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: typeof newTask) => {
      const taskData = {
        ...data,
        companyId: user?.companyId || data.companyId,
      };
      return tasksApi.createTask(taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
      setShowCreateModal(false);
      setNewTask({
        title: "",
        description: "",
        type: "GENERAL",
        priority: "MEDIUM",
        estimatedHours: 8,
        dueDate: "",
        companyId: "",
        assignedToId: "",
      });
    },
    onError: () => {
      toast.error("Failed to create task");
    },
  });

  // Assign task mutation
  const assignTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      employeeId,
    }: {
      taskId: string;
      employeeId: string;
    }) => {
      return tasksApi.assignTask(taskId, employeeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task assigned successfully");
      setShowSuggestionsModal(false);
      setSelectedTaskForAssignment(null);
    },
    onError: () => {
      toast.error("Failed to assign task");
    },
  });

  // Auto-assign mutation
  const autoAssignMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return workAssignmentApi.autoAssignTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task auto-assigned successfully");
      setShowSuggestionsModal(false);
      setSelectedTaskForAssignment(null);
    },
    onError: () => {
      toast.error("Failed to auto-assign task");
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: string;
      status: string;
    }) => {
      if (status === "IN_PROGRESS") {
        return tasksApi.startTask(taskId);
      } else if (status === "COMPLETED") {
        // Provide default actualHours if not specified
        return tasksApi.completeTask(taskId, 1, "Task completed");
      } else {
        return tasksApi.updateStatus(taskId, status);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task status updated");
    },
    onError: () => {
      toast.error("Failed to update task status");
    },
  });

  // Verify task completion mutation
  const verifyTaskMutation = useMutation({
    mutationFn: async (data: typeof verifyData) => {
      if (!selectedTaskForVerification) throw new Error("No task selected");
      // In a real app, this would call a verification endpoint
      // For now, we'll just update the status
      return tasksApi.updateStatus(selectedTaskForVerification.id, "COMPLETED");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      // Send notification to employee
      if (selectedTaskForVerification?.assignedTo?.id) {
        if (verifyData.approved) {
          sendNotification(
            selectedTaskForVerification.assignedTo.id,
            "task_verified",
            {
              taskTitle: selectedTaskForVerification.title,
              points: verifyData.score,
              feedback: verifyData.feedback,
              approved: true,
              taskId: selectedTaskForVerification.id,
            }
          );
        } else {
          sendNotification(
            selectedTaskForVerification.assignedTo.id,
            "task_verified",
            {
              taskTitle: selectedTaskForVerification.title,
              feedback: verifyData.feedback,
              approved: false,
              taskId: selectedTaskForVerification.id,
            }
          );
        }
      }

      toast.success(
        verifyData.approved
          ? `Task approved! +${verifyData.score} points awarded to ${selectedTaskForVerification?.assignedTo?.name}`
          : `Task rejected. ${selectedTaskForVerification?.assignedTo?.name} will be notified.`
      );
      setShowVerifyModal(false);
      setSelectedTaskForVerification(null);
    },
    onError: () => {
      toast.error("Failed to verify task");
    },
  });

  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const tasksByStatus = {
    TODO: filteredTasks?.filter((t) => t.status === "TODO") || [],
    IN_PROGRESS: filteredTasks?.filter((t) => t.status === "IN_PROGRESS") || [],
    COMPLETED: filteredTasks?.filter((t) => t.status === "COMPLETED") || [],
    BLOCKED: filteredTasks?.filter((t) => t.status === "BLOCKED") || [],
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "TODO":
        return <Circle className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <Play className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      case "BLOCKED":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    createTaskMutation.mutate(newTask);
  };

  const handleAssignWithAI = (taskId: string) => {
    setSelectedTaskForAssignment(taskId);
    setShowSuggestionsModal(true);
  };

  const handleAssignEmployee = (taskId: string, employeeId: string) => {
    assignTaskMutation.mutate({ taskId, employeeId });
  };

  const handleAutoAssign = (taskId: string) => {
    autoAssignMutation.mutate(taskId);
  };

  const canManageTasks =
    user && (user.role === "MANAGER" || user.role === "ADMIN");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            {canManageTasks ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Task Management
                </h1>
                <p className="text-gray-600">
                  AI-powered task assignment and tracking
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  My Tasks
                </h1>
                <p className="text-gray-600">
                  Complete your assigned tasks and track your progress
                </p>
              </>
            )}
          </div>
          {canManageTasks && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </Button>
          )}
        </div>

        {/* Filters - Only for Managers */}
        {canManageTasks && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "board" ? "primary" : "outline"}
                    onClick={() => setViewMode("board")}
                  >
                    Board
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "primary" : "outline"}
                    onClick={() => setViewMode("list")}
                  >
                    List
                  </Button>
                  {canManageTasks && (
                    <Button
                      variant={
                        viewMode === "verification" ? "primary" : "outline"
                      }
                      onClick={() => setViewMode("verification")}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify Tasks
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Simple Search for Employees */}
        {!canManageTasks && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your tasks..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kanban Board */}
        {viewMode === "board" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <div key={status} className="flex flex-col">
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <CardTitle className="text-sm">
                          {status.replace("_", " ")}
                        </CardTitle>
                      </div>
                      <Badge>{statusTasks.length}</Badge>
                    </div>
                  </CardHeader>
                </Card>

                <div className="space-y-3 flex-1">
                  {statusTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="mb-3">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {task.title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {task.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            {task.taskType}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedHours}h
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        </div>

                        {task.assignedTo ? (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                                {task.assignedTo.name.charAt(0)}
                              </div>
                              <span className="text-sm text-gray-700">
                                {task.assignedTo.name}
                              </span>
                            </div>
                          </div>
                        ) : (
                          canManageTasks && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-3 flex items-center justify-center gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignWithAI(task.id);
                              }}
                            >
                              <Sparkles className="w-3 h-3" />
                              AI Assign
                            </Button>
                          )
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks?.map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {task.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {task.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <span className="text-sm">
                            {task.status.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                              {task.assignedTo.name.charAt(0)}
                            </div>
                            <span className="text-sm">
                              {task.assignedTo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {canManageTasks ? (
                          <>
                            {!task.assignedTo && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignWithAI(task.id);
                                }}
                                className="flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                AI Assign
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            {task.status === "ASSIGNED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatusMutation.mutate({
                                    taskId: task.id,
                                    status: "IN_PROGRESS",
                                  });
                                }}
                                className="flex items-center gap-1"
                              >
                                <Play className="w-3 h-3" />
                                Start
                              </Button>
                            )}
                            {task.status === "IN_PROGRESS" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatusMutation.mutate({
                                    taskId: task.id,
                                    status: "COMPLETED",
                                  });
                                }}
                                className="flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Complete
                              </Button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Verification View */}
        {viewMode === "verification" && canManageTasks && (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Tasks Awaiting Verification
                </CardTitle>
              </CardHeader>
            </Card>

            {filteredTasks &&
            filteredTasks.filter((t) => t.status === "REVIEW").length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">All tasks verified!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTasks
                  ?.filter((t) => t.status === "REVIEW")
                  .map((task: Task) => (
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
                                <span className="text-gray-600">
                                  Assigned to:{" "}
                                </span>
                                <span className="font-medium">
                                  {task.assignedTo?.name} (
                                  {task.assignedTo?.email})
                                </span>
                              </p>
                              <p className="text-sm">
                                <span className="text-gray-600">
                                  Completed:{" "}
                                  {task.completedAt
                                    ? new Date(
                                        task.completedAt
                                      ).toLocaleString()
                                    : "N/A"}
                                </span>
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-purple-100 text-purple-800">
                            REVIEW
                          </Badge>
                        </div>

                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => {
                              setSelectedTaskForVerification(task);
                              setVerifyData({
                                approved: true,
                                score: 10,
                                feedback: "",
                              });
                              setShowVerifyModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
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
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
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
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
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
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask({ ...newTask, priority: e.target.value })
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
                Task Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newTask.type}
                onChange={(e) =>
                  setNewTask({ ...newTask, type: e.target.value })
                }
              >
                <option value="GENERAL">General</option>
                <option value="FEATURE">Feature</option>
                <option value="BUG">Bug</option>
                <option value="SUPPORT">Support</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newTask.estimatedHours}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    estimatedHours: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newTask.dueDate}
                onChange={(e) =>
                  setNewTask({ ...newTask, dueDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Employee
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={newTask.assignedToId}
              onChange={(e) =>
                setNewTask({ ...newTask, assignedToId: e.target.value })
              }
            >
              <option value="">Unassigned</option>
              {employees && employees.length > 0 ? (
                employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.email && `(${emp.email})`}
                  </option>
                ))
              ) : (
                <option disabled>No employees available</option>
              )}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCreateTask}
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Suggestions Modal */}
      <Modal
        isOpen={showSuggestionsModal}
        onClose={() => {
          setShowSuggestionsModal(false);
          setSelectedTaskForAssignment(null);
        }}
        title="AI-Powered Employee Suggestions"
      >
        {loadingSuggestions ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Analyzing employees...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-900">
                AI analyzed performance, workload, skills, and experience to
                find the best match
              </p>
            </div>

            {suggestions && suggestions.length > 0 ? (
              <>
                {suggestions.map((suggestion, index) => (
                  <Card key={suggestion.employee.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                            {suggestion.employee.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {suggestion.employee.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {suggestion.employee.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Confidence</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {(suggestion.confidenceScore * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">Performance</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {(
                              suggestion.reasoning.performanceScore * 100
                            ).toFixed(0)}
                            %
                          </p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">Availability</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {(
                              suggestion.reasoning.availabilityScore * 100
                            ).toFixed(0)}
                            %
                          </p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">Skills</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {(
                              suggestion.reasoning.skillMatchScore * 100
                            ).toFixed(0)}
                            %
                          </p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600">Experience</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {(
                              suggestion.reasoning.experienceScore * 100
                            ).toFixed(0)}
                            %
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Score: </span>
                          <span className="font-semibold text-gray-900">
                            {suggestion.employee.performanceScore.toFixed(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Workload: </span>
                          <span className="font-semibold text-gray-900">
                            {suggestion.employee.currentWorkload}/
                            {suggestion.employee.workCapacity}
                          </span>
                        </div>
                      </div>

                      {suggestion.employee.skillTags &&
                        suggestion.employee.skillTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {suggestion.employee.skillTags
                              .slice(0, 5)
                              .map((skill) => (
                                <span
                                  key={skill}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                          </div>
                        )}

                      <Button
                        onClick={() =>
                          handleAssignEmployee(
                            selectedTaskForAssignment!,
                            suggestion.employee.id
                          )
                        }
                        disabled={assignTaskMutation.isPending}
                        className="w-full"
                        variant={index === 0 ? "primary" : "outline"}
                      >
                        {index === 0 && "⭐ "}
                        Assign to {suggestion.employee.name.split(" ")[0]}
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  onClick={() => handleAutoAssign(selectedTaskForAssignment!)}
                  disabled={autoAssignMutation.isPending}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Auto-Assign to Best Match
                </Button>
              </>
            ) : (
              <div className="py-8 text-center text-gray-600">
                No suitable employees found
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Verify Task Modal */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setSelectedTaskForVerification(null);
        }}
        title="Verify Task Completion"
      >
        {selectedTaskForVerification && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                {selectedTaskForVerification.title}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {selectedTaskForVerification.description}
              </p>
              <p className="text-sm">
                <span className="font-medium">Completed by: </span>
                {selectedTaskForVerification.assignedTo?.name}
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
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">On-Time Bonus:</span>
                      <span className="font-medium text-green-600">+5</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                      <span className="text-gray-700 font-medium">
                        Quality Rating (1-5):
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => {
                              const baseScore = 10 + 5;
                              const qualityScore = Math.floor(
                                (rating / 5) * 10
                              );
                              setVerifyData({
                                ...verifyData,
                                score: baseScore + qualityScore,
                              });
                            }}
                            className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                              verifyData.score ===
                              baseScore + Math.floor((rating / 5) * 10)
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
                  setSelectedTaskForVerification(null);
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
