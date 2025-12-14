"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api/employee-management";
import { getStoredUser } from "@/lib/auth-utils";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Calendar, CheckCircle, Clock, User, Filter } from "lucide-react";
import { toast } from "sonner";

type TaskStatus = "all" | "SCHEDULED" | "COMPLETED";

export default function MyTasksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<TaskStatus>("all");
  const [userId, setUserId] = useState<string>("");

  // Get current user
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUserId(user.id);
  }, [router]);

  // Fetch user's tasks
  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: ["my-tasks", userId, statusFilter],
    queryFn: async () => {
      const status = statusFilter === "all" ? undefined : statusFilter;
      const response = await tasksApi.getTasks({
        assignedToId: userId,
        status,
      });
      return response.data;
    },
    enabled: !!userId,
  });

  const tasks = tasksResponse || [];

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.updateTask(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success("Task updated successfully");
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });

  const handleCompleteTask = (taskId: string) => {
    updateTaskMutation.mutate({ id: taskId, status: "COMPLETED" });
  };

  const handleReopenTask = (taskId: string) => {
    updateTaskMutation.mutate({ id: taskId, status: "SCHEDULED" });
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

  const getStatusStats = () => {
    return {
      all: tasks.length,
      scheduled: tasks.filter((t: any) => t.status === "SCHEDULED").length,
      completed: tasks.filter((t: any) => t.status === "COMPLETED").length,
    };
  };

  const stats = getStatusStats();

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center py-12">Loading your tasks...</div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
          <p className="text-gray-600">Manage and track your assigned tasks</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.all}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Filter className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Scheduled</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.scheduled}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.completed}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={statusFilter === "all" ? "primary" : "outline"}
            onClick={() => setStatusFilter("all")}
          >
            All ({stats.all})
          </Button>
          <Button
            variant={statusFilter === "SCHEDULED" ? "primary" : "outline"}
            onClick={() => setStatusFilter("SCHEDULED")}
          >
            Scheduled ({stats.scheduled})
          </Button>
          <Button
            variant={statusFilter === "COMPLETED" ? "primary" : "outline"}
            onClick={() => setStatusFilter("COMPLETED")}
          >
            Completed ({stats.completed})
          </Button>
        </div>

        {/* Tasks List */}
        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tasks.map((task: any) => (
              <Card
                key={task.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3
                        className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
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

                  <div className="space-y-2 mb-4">
                    {task.scheduledDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Scheduled:{" "}
                        {new Date(task.scheduledDate).toLocaleDateString()}
                      </div>
                    )}
                    {task.assignedBy && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        Assigned by: {task.assignedBy.name}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {task.status === "SCHEDULED" && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={updateTaskMutation.isPending}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                    {task.status === "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReopenTask(task.id)}
                        disabled={updateTaskMutation.isPending}
                        className="flex-1"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Reopen
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 mb-4">No tasks found</p>
              <p className="text-sm text-gray-400">
                {statusFilter === "all"
                  ? "You don't have any tasks assigned yet"
                  : `No ${statusFilter.toLowerCase()} tasks found`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
