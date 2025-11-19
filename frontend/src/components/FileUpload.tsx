"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, File, Image as ImageIcon, FileText } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import api from "@/lib/api";

interface FileUploadProps {
  attachableType: "DEAL" | "CONTACT" | "ACTIVITY" | "COMMENT";
  attachableId: string;
  onUploadComplete?: () => void;
}

export default function FileUpload({
  attachableType,
  attachableId,
  onUploadComplete,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);

      try {
        for (const file of acceptedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("attachableType", attachableType);
          formData.append("attachableId", attachableId);

          const response = await api.post("/attachments/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          setUploadedFiles((prev) => [...prev, response.data]);
        }

        if (onUploadComplete) {
          onUploadComplete();
        }
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload file");
      } finally {
        setUploading(false);
      }
    },
    [attachableType, attachableId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        [".xlsx"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
    },
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (mimeType === "application/pdf")
      return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`p-8 border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload
            className={`h-10 w-10 ${
              isDragActive ? "text-primary" : "text-gray-400"
            }`}
          />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? "Drop the files here..."
              : "Drag & drop files here, or click to select"}
          </p>
          <p className="text-xs text-gray-500">
            Max file size: 10MB (Images, PDF, Docs, Excel, CSV)
          </p>
        </div>
      </Card>

      {uploading && (
        <div className="text-center text-sm text-gray-600">
          Uploading files...
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Just Uploaded:</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                {getFileIcon(file.mimeType)}
                <div>
                  <p className="text-sm font-medium text-green-900">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-green-700">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
