"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, Trash2, File, Image as ImageIcon, FileText } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import api from "@/lib/api";

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

interface AttachmentListProps {
  attachableType: "DEAL" | "CONTACT" | "ACTIVITY" | "COMMENT";
  attachableId: string;
  refreshTrigger?: number;
}

export default function AttachmentList({
  attachableType,
  attachableId,
  refreshTrigger,
}: AttachmentListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttachments = useCallback(async () => {
    try {
      const response = await api.get(
        `/api/attachments?type=${attachableType}&id=${attachableId}`
      );
      setAttachments(response.data);
    } catch (error) {
      console.error("Failed to fetch attachments:", error);
    } finally {
      setLoading(false);
    }
  }, [attachableType, attachableId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments, refreshTrigger]);

  const handleDownload = async (id: string, originalName: string) => {
    try {
      const response = await api.get(`/api/attachments/${id}/download`, {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    try {
      await api.delete(`/api/attachments/${id}`);
      setAttachments((prev) => prev.filter((att) => att.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete attachment");
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (mimeType === "application/pdf")
      return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading attachments...</div>;
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No attachments yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <Card key={attachment.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getFileIcon(attachment.mimeType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachment.size)} • {formatDate(attachment.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(attachment.id, attachment.originalName)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(attachment.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
