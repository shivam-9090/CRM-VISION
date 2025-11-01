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
import { ArrowLeft, Edit, DollarSign, Calendar, User, Tag } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  value?: number;
  stage: string;
  priority?: string;
  expectedCloseDate?: string;
  notes?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  company: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export default function DealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params.id as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [attachmentRefresh, setAttachmentRefresh] = useState(0);

  const fetchDeal = async () => {
    try {
      const response = await api.get(`/api/deals/${dealId}`);
      setDeal(response.data);
    } catch (error) {
      console.error("Failed to fetch deal:", error);
      alert("Failed to load deal");
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

    fetchDeal();
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, router]);

  const formatCurrency = (value?: number) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStageLabel = (stage: string) => {
    const stageMap: Record<string, string> = {
      LEAD: "New Lead",
      QUALIFIED: "Qualified",
      NEGOTIATION: "Negotiation",
      CLOSED_WON: "Won",
      CLOSED_LOST: "Lost",
    };
    return stageMap[stage] || stage;
  };

  const getPriorityColor = (priority?: string) => {
    const colorMap: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-800",
      MEDIUM: "bg-blue-100 text-blue-800",
      HIGH: "bg-orange-100 text-orange-800",
      URGENT: "bg-red-100 text-red-800",
    };
    return colorMap[priority || "MEDIUM"] || colorMap.MEDIUM;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Loading deal...</div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Deal not found</div>
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
              <Link href="/deals">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Deals
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">{deal.title}</h1>
            </div>
            <Link href={`/deals/${dealId}/edit`}>
              <Button variant="primary">
                <Edit className="mr-2 h-4 w-4" />
                Edit Deal
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Deal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Value
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="text-lg font-semibold">
                          {formatCurrency(deal.value)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Stage
                      </label>
                      <div className="mt-1">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                          {getStageLabel(deal.stage)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Priority
                      </label>
                      <div className="mt-1">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                            deal.priority
                          )}`}
                        >
                          {deal.priority || "MEDIUM"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Expected Close Date
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {formatDate(deal.expectedCloseDate)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Company
                      </label>
                      <div className="mt-1">
                        <span className="text-gray-900">
                          {deal.company.name}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Contact
                      </label>
                      <div className="mt-1">
                        <span className="text-gray-900">
                          {deal.contact
                            ? `${deal.contact.firstName} ${deal.contact.lastName}`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    {deal.assignedTo && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-500">
                          Assigned To
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">
                            {deal.assignedTo.name}
                          </span>
                          <span className="text-gray-500 text-sm">
                            ({deal.assignedTo.email})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {deal.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <label className="text-sm font-medium text-gray-500">
                        Notes
                      </label>
                      <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                        {deal.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments Section */}
              <CommentSection
                entityType="DEAL"
                entityId={dealId}
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
                      attachableType="DEAL"
                      attachableId={dealId}
                      onUploadComplete={() => setAttachmentRefresh((prev) => prev + 1)}
                    />
                    <AttachmentList
                      attachableType="DEAL"
                      attachableId={dealId}
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
                        {formatDate(deal.createdAt)}
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
