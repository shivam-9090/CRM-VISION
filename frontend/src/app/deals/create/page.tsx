"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { verify } from "@/lib/auth";
import { useInvalidateQueries } from "@/lib/use-invalidate-queries";
import Sidebar from "@/components/layout/Sidebar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

const DEAL_STAGES = [
  { value: "LEAD", label: "Lead" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "CLOSED_WON", label: "Closed Won" },
  { value: "CLOSED_LOST", label: "Closed Lost" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const LEAD_SOURCES = [
  { value: "WEBSITE", label: "Website" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "REFERRAL", label: "Referral" },
  { value: "COLD_CALL", label: "Cold Call" },
  { value: "EMAIL_CAMPAIGN", label: "Email Campaign" },
  { value: "TRADE_SHOW", label: "Trade Show" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "DIRECT_MAIL", label: "Direct Mail" },
  { value: "PARTNER", label: "Partner" },
  { value: "OTHER", label: "Other" },
];

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

export default function CreateDealPage() {
  const router = useRouter();
  const { invalidateOnDealChange } = useInvalidateQueries(); // Add cache invalidation
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    value: "",
    stage: "LEAD",
    priority: "MEDIUM",
    leadSource: "WEBSITE",
    contactId: "",
    assignedToId: "",
    expectedCloseDate: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Get current user and load contacts/team members on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await verify();
        if (user) {
          setCurrentUser({ id: user.id, name: user.name });
          setFormData((prev) => ({ ...prev, assignedToId: user.id })); // Default to current user
        }

        // Fetch contacts
        const contactsResponse = await api.get("/contacts");
        const contactsData = Array.isArray(contactsResponse.data)
          ? contactsResponse.data
          : contactsResponse.data?.data || [];
        setContacts(contactsData);

        // Fetch team members (users in same company)
        const companiesResponse = await api.get("/companies");
        // Companies endpoint returns array with user's company including users
        const companyData = Array.isArray(companiesResponse.data)
          ? companiesResponse.data[0]
          : companiesResponse.data;
        const usersData = companyData?.users || [];
        setTeamMembers(usersData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  // Removed contact fetching as contact field is no longer required

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

    const submitData = {
      title: formData.title,
      stage: formData.stage,
      priority: formData.priority,
      leadSource: formData.leadSource,
      value: formData.value ? parseFloat(formData.value) : undefined,
      expectedCloseDate: formData.expectedCloseDate || undefined,
      notes: formData.notes || undefined,
      contactId: formData.contactId || undefined,
      assignedToId: formData.assignedToId || currentUser?.id,
    };

    console.log("Submitting deal data:", submitData);

    try {
      const response = await api.post("/deals", submitData);
      console.log("Deal created successfully:", response.data);

      // ✅ Invalidate cache to refresh dashboard and deals list in real-time
      invalidateOnDealChange();

      router.push("/deals");
    } catch (err: unknown) {
      console.error("Deal creation failed:", err);
      if (err && typeof err === "object" && "response" in err) {
        const response = err as {
          response?: {
            data?: { errors?: Record<string, string>; message?: string };
          };
        };
        if (response.response?.data?.errors) {
          setErrors(response.response.data.errors);
        } else {
          setErrors({
            general:
              response.response?.data?.message || "Failed to create deal",
          });
        }
      } else {
        setErrors({ general: "Failed to create deal" });
      }
    } finally {
      setLoading(false);
    }
  };

  // Contact options removed as contact field is no longer required

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4 bg-gray-50 min-h-screen animate-fade-in">
        <div className="mb-8">
          <Link
            href="/deals"
            className="inline-flex items-center text-gray-600 hover:text-black mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Link>
          <h1 className="text-3xl font-bold text-black animate-slide-in-left">
            Create Deal
          </h1>
        </div>

        <Card className="max-w-xl mx-auto hover:shadow-lg transition-all duration-300 animate-bounce-subtle">
          <CardHeader>
            <CardTitle>Deal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {errors.general}
                </div>
              )}

              <Input
                label="Deal Title *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description / Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add any notes or description for this deal..."
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                )}
              </div>

              <Input
                label="Deal Value"
                name="value"
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={handleChange}
                error={errors.value}
                placeholder="0.00"
              />

              <Select
                label="Stage *"
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                options={DEAL_STAGES}
                error={errors.stage}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Priority *"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  options={PRIORITIES}
                  error={errors.priority}
                  required
                />

                <Select
                  label="Lead Source *"
                  name="leadSource"
                  value={formData.leadSource}
                  onChange={handleChange}
                  options={LEAD_SOURCES}
                  error={errors.leadSource}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Contact (Optional)"
                  name="contactId"
                  value={formData.contactId}
                  onChange={handleChange}
                  options={[
                    { value: "", label: "No contact" },
                    ...contacts.map((contact) => ({
                      value: contact.id,
                      label: `${contact.firstName} ${contact.lastName}`,
                    })),
                  ]}
                />

                <Select
                  label="Assigned To"
                  name="assignedToId"
                  value={formData.assignedToId}
                  onChange={handleChange}
                  options={teamMembers.map((member) => ({
                    value: member.id,
                    label: member.name,
                  }))}
                />
              </div>

              <Input
                label="Expected Close Date"
                name="expectedCloseDate"
                type="date"
                value={formData.expectedCloseDate}
                onChange={handleChange}
                error={errors.expectedCloseDate}
                placeholder="Select expected close date"
              />

              <div className="flex gap-4">
                <Button type="submit" isLoading={loading}>
                  Create Deal
                </Button>
                <Link href="/deals">
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
