"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { hasAuthToken } from "@/lib/auth-utils";
import api from "@/lib/api";
import Sidebar from "@/components/layout/Sidebar";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import CommentSection from "@/components/comments/CommentSection";
import FileUpload from "@/components/FileUpload";
import AttachmentList from "@/components/AttachmentList";
import { ArrowLeft, Edit, Calendar, User, FileText } from "lucide-react";

interface Activity {
  id: string;
  title: string;
  type: string;
  status: string;
  description?: string;
  scheduledDate: string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  deal?: {
    id: string;
    title: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  company: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export default function ActivityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const activityId = params.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [attachmentRefresh, setAttachmentRefresh] = useState(0);

  const fetchActivity = async () => {
    try {
      const response = await api.get(`/api/activities/${activityId}`);
      setActivity(response.data);
    } catch (error) {
      console.error("Failed to fetch activity:", error);
      alert("Failed to load activity");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/api/users/profile");
      setCurrentUserId(response.data.id);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  useEffect(() => {
    if (!hasAuthToken()) {
      router.push("/auth/login");
      return;
    }

    fetchActivity();
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      TASK: "bg-blue-100 text-blue-800",
      CALL: "bg-green-100 text-green-800",
      MEETING: "bg-purple-100 text-purple-800",
      EMAIL: "bg-yellow-100 text-yellow-800",
      NOTE: "bg-gray-100 text-gray-800",
    };
    return colorMap[type] || colorMap.TASK;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      SCHEDULED: "bg-orange-100 text-orange-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colorMap[status] || colorMap.SCHEDULED;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Loading activity...</div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Activity not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/activities">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Activities
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">{activity.title}</h1>
            </div>
            <Link href={`/activities/${activityId}/edit`}>
              <Button variant="primary">
                <Edit className="mr-2 h-4 w-4" />
                Edit Activity
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Activity Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Type
                      </label>
                      <div className="mt-1">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                            activity.type
                          )}`}
                        >
                          {activity.type}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Status
                      </label>
                      <div className="mt-1">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            activity.status
                          )}`}
                        >
                          {activity.status}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">
                        Scheduled Date
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {formatDate(activity.scheduledDate)}
                        </span>
                      </div>
                    </div>
                    {activity.contact && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Contact
                        </label>
                        <div className="mt-1">
                          <span className="text-gray-900">
                            {activity.contact.firstName}{" "}
                            {activity.contact.lastName}
                          </span>
                        </div>
                      </div>
                    )}
                    {activity.deal && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Deal
                        </label>
                        <div className="mt-1">
                          <span className="text-gray-900">
                            {activity.deal.title}
                          </span>
                        </div>
                      </div>
                    )}
                    {activity.assignedTo && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-500">
                          Assigned To
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">
                            {activity.assignedTo.name}
                          </span>
                          <span className="text-gray-500 text-sm">
                            ({activity.assignedTo.email})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {activity.description && (
                    <div className="mt-4 pt-4 border-t">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Description
                      </label>
                      <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                        {activity.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments Section */}
              <CommentSection
                entityType="ACTIVITY"
                entityId={activityId}
                currentUserId={currentUserId || undefined}
              />

              {/* Attachments Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <FileUpload
                      attachableType="ACTIVITY"
                      attachableId={activityId}
                      onUploadComplete={() => setAttachmentRefresh((prev) => prev + 1)}
                    />
                    <AttachmentList
                      attachableType="ACTIVITY"
                      attachableId={activityId}
                      refreshTrigger={attachmentRefresh}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Created
                      </label>
                      <p className="text-gray-900 mt-1">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
