"use client";

import { useState } from "react";
import { Download, Upload, FileText, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import api from "@/lib/api";

type ExportType = "contacts" | "deals" | "activities" | "company";

export default function ExportImportPage() {
  const [loading, setLoading] = useState<ExportType | null>(null);
  const [importing, setImporting] = useState<ExportType | null>(null);

  const handleExport = async (type: ExportType) => {
    try {
      setLoading(type);

      const response = await api.get(`/api/export/${type}`, {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${type}-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} data has been exported to CSV.`);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to export data");
    } finally {
      setLoading(null);
    }
  };

  const handleImport = async (
    type: ExportType,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    event.target.value = "";

    try {
      setImporting(type);

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(`/api/export/import/${type}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = response.data;

      alert(
        `Import Completed: Successfully imported ${result.success} records. ${
          result.failed > 0 ? `${result.failed} records failed.` : ""
        }`
      );

      // Show detailed errors if any
      if (result.errors && result.errors.length > 0) {
        console.error("Import errors:", result.errors);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to import data");
    } finally {
      setImporting(null);
    }
  };

  const exportCards = [
    {
      type: "contacts" as ExportType,
      title: "Contacts",
      description: "Export all contacts to CSV format",
      icon: FileText,
    },
    {
      type: "deals" as ExportType,
      title: "Deals",
      description: "Export all deals to CSV format",
      icon: FileText,
    },
    {
      type: "activities" as ExportType,
      title: "Activities",
      description: "Export all activities to CSV format",
      icon: FileText,
    },
    {
      type: "company" as ExportType,
      title: "Company",
      description: "Export company information to CSV format",
      icon: FileText,
    },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Export & Import Data</h1>
        <p className="text-muted-foreground mt-2">
          Export your CRM data to CSV or import data from CSV files
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {exportCards.map((card) => (
          <Card key={card.type} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <card.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </div>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-2">
              {/* Export Button */}
              <Button
                onClick={() => handleExport(card.type)}
                disabled={loading === card.type || importing === card.type}
                variant="outline"
                className="w-full"
              >
                {loading === card.type ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>

              {/* Import Button */}
              <div>
                <input
                  id={`import-${card.type}`}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleImport(card.type, e)}
                  disabled={importing === card.type || loading === card.type}
                />
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={importing === card.type || loading === card.type}
                  onClick={() => document.getElementById(`import-${card.type}`)?.click()}
                >
                  {importing === card.type ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import CSV
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Import Guidelines</CardTitle>
          <CardDescription>
            Follow these guidelines for successful CSV imports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Contacts CSV Format:</h3>
            <p className="text-sm text-muted-foreground">
              Required columns: <code>First Name</code>, <code>Last Name</code>,{" "}
              <code>Email</code>
            </p>
            <p className="text-sm text-muted-foreground">
              Optional columns: <code>Phone</code>
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Deals CSV Format:</h3>
            <p className="text-sm text-muted-foreground">
              Required columns: <code>Title</code>
            </p>
            <p className="text-sm text-muted-foreground">
              Optional columns: <code>Value</code>, <code>Stage</code> (LEAD,
              QUALIFIED, NEGOTIATION, CLOSED_WON, CLOSED_LOST),{" "}
              <code>Priority</code> (LOW, MEDIUM, HIGH, URGENT),{" "}
              <code>Contact Email</code>, <code>Expected Close Date</code>,{" "}
              <code>Closed At</code>
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Activities CSV Format:</h3>
            <p className="text-sm text-muted-foreground">
              Required columns: <code>Title</code>, <code>Scheduled Date</code>
            </p>
            <p className="text-sm text-muted-foreground">
              Optional columns: <code>Description</code>, <code>Type</code>{" "}
              (CALL, MEETING, TASK, EMAIL, NOTE), <code>Status</code> (SCHEDULED,
              COMPLETED, CANCELLED), <code>Contact Email</code>,{" "}
              <code>Deal Title</code>, <code>Assigned Email</code>
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> Exported CSV files will include all
              necessary columns for re-import. You can download a CSV, modify
              it, and upload it back to bulk update or create records.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
