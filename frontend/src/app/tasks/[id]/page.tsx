"use client";

import { use, useEffect, useState } from "react";
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
  CheckCircle,
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

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
  }, []);

  // Fetch task details
  const { data: taskResponse, isLoading } = useQuery({
    queryKey: ["task", resolvedParams.id],
    queryFn: async () => {
      const response = await tasksApi.getTask(resolvedParams.id);
      return response.data;
    },
  });

  const task = taskResponse;

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return tasksApi.updateTask(resolvedParams.id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", resolvedParams.id] });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-300";
      case "SCHEDULED":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  if (isLoading || !task) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center py-12">Loading task...</div>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/tasks")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {task.title}
              </h1>
              <Badge className={`${getStatusBadge(task.status)} border`}>
                {task.status}
              </Badge>
            </div>

            {task.status === "SCHEDULED" && (
              <Button
                onClick={() => updateStatusMutation.mutate("COMPLETED")}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  {task.description || "No description provided"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.assignedTo && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <User className="w-4 h-4" />
                      <span>Assigned To</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {task.assignedTo.name}
                    </p>
                  </div>
                )}

                {task.scheduledDate && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Scheduled Date</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {new Date(task.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {task.deal && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Related Deal
                    </div>
                    <p className="font-medium text-gray-900">
                      {task.deal.title}
                    </p>
                  </div>
                )}

                {task.contact && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Contact</div>
                    <p className="font-medium text-gray-900">
                      {task.contact.firstName} {task.contact.lastName}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {task.status === "SCHEDULED" && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => updateStatusMutation.mutate("COMPLETED")}
                    >
                      Mark as Complete
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => updateStatusMutation.mutate("CANCELLED")}
                    >
                      Cancel Task
                    </Button>
                  </>
                )}

                {task.status === "COMPLETED" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => updateStatusMutation.mutate("SCHEDULED")}
                  >
                    Reopen Task
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
