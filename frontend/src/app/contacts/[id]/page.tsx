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
import { ArrowLeft, Edit, Mail, Phone, Building2 } from "lucide-react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export default function ContactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [attachmentRefresh, setAttachmentRefresh] = useState(0);

  const fetchContact = async () => {
    try {
      const response = await api.get(`/api/contacts/${contactId}`);
      setContact(response.data);
    } catch (error) {
      console.error("Failed to fetch contact:", error);
      alert("Failed to load contact");
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

    fetchContact();
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Loading contact...</div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Contact not found</div>
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
              <Link href="/contacts">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Contacts
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">
                {contact.firstName} {contact.lastName}
              </h1>
            </div>
            <Link href={`/contacts/${contactId}/edit`}>
              <Button variant="primary">
                <Edit className="mr-2 h-4 w-4" />
                Edit Contact
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contact.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Email
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {contact.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {contact.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Phone
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {contact.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Company
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">
                          {contact.company.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section */}
              <CommentSection
                entityType="CONTACT"
                entityId={contactId}
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
                      attachableType="CONTACT"
                      attachableId={contactId}
                      onUploadComplete={() => setAttachmentRefresh((prev) => prev + 1)}
                    />
                    <AttachmentList
                      attachableType="CONTACT"
                      attachableId={contactId}
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
                        {formatDate(contact.createdAt)}
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
