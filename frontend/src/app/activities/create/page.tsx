"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useInvalidateQueries } from "@/lib/use-invalidate-queries";
import api from "@/lib/api";
import Sidebar from "@/components/layout/Sidebar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

const ACTIVITY_TYPES = [
  { value: "TASK", label: "Task" },
  { value: "CALL", label: "Call" },
  { value: "MEETING", label: "Meeting" },
  { value: "EMAIL", label: "Email" },
  { value: "NOTE", label: "Note" },
];

const ACTIVITY_STATUS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function CreateActivityPage() {
  const router = useRouter();
  const { invalidateOnActivityChange } = useInvalidateQueries();
  const [formData, setFormData] = useState({
    title: "",
    type: "TASK",
    status: "SCHEDULED",
    scheduledDate: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await api.post("/activities", formData);
      // ✅ Invalidate cache to refresh dashboard and activities list in real-time
      invalidateOnActivityChange();
      router.push("/activities");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as any).response;
        if (response?.data?.errors) {
          setErrors(response.data.errors);
        } else {
          setErrors({
            general: response?.data?.message || "Failed to create activity",
          });
        }
      } else {
        setErrors({ general: "Failed to create activity" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4 bg-gray-50 min-h-screen animate-fade-in">
        <div className="mb-8">
          <Link
            href="/activities"
            className="inline-flex items-center text-gray-600 hover:text-black mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Activities
          </Link>
          <h1 className="text-3xl font-bold text-black animate-slide-in-left">
            Create Activity
          </h1>
        </div>

        <Card className="max-w-xl mx-auto hover:shadow-lg transition-all duration-300 animate-bounce-subtle">
          <CardHeader>
            <CardTitle>Activity Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {errors.general}
                </div>
              )}

              <Input
                label="Activity Title *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Type *"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  options={ACTIVITY_TYPES}
                  error={errors.type}
                  required
                />

                <Select
                  label="Status *"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={ACTIVITY_STATUS}
                  error={errors.status}
                  required
                />
              </div>

              <Input
                label="Scheduled Date *"
                name="scheduledDate"
                type="date"
                min={today}
                value={formData.scheduledDate}
                onChange={handleChange}
                error={errors.scheduledDate}
                required
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="flex w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-base font-semibold text-black placeholder:text-gray-600 placeholder:font-medium focus:outline-none focus:ring-4 focus:ring-gray-200 focus:border-black transition-all duration-200"
                  placeholder="Enter activity description..."
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" isLoading={loading}>
                  Create Activity
                </Button>
                <Link href="/activities">
                  <Button variant="secondary" type="button">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
