"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Textarea from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Clock, MapPin, Users, Plus, X } from "lucide-react";
import { calendarApi, CreateMeetingDto } from "@/lib/api/calendar";
import { toast } from "sonner";

interface MeetingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: {
    dealId?: string;
    contactId?: string;
  };
}

export default function MeetingFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: MeetingFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateMeetingDto>({
    title: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    dealId: initialData?.dealId,
    contactId: initialData?.contactId,
    attendees: [],
    reminders: [{ minutes: 15, method: "NOTIFICATION" as const }],
    agenda: "",
    syncToGoogle: true,
    addGoogleMeet: false,
  });

  const [newAttendee, setNewAttendee] = useState({ email: "", name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await calendarApi.createMeeting(formData);
      toast.success("Meeting created successfully");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  const addAttendee = () => {
    if (newAttendee.email) {
      setFormData((prev) => ({
        ...prev,
        attendees: [...(prev.attendees || []), newAttendee],
      }));
      setNewAttendee({ email: "", name: "" });
    }
  };

  const removeAttendee = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees?.filter((_, i) => i !== index),
    }));
  };

  const addReminder = () => {
    setFormData((prev) => ({
      ...prev,
      reminders: [
        ...(prev.reminders || []),
        { minutes: 30, method: "EMAIL" as const },
      ],
    }));
  };

  const removeReminder = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      reminders: prev.reminders?.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              placeholder="Product Demo with Client"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="inline-block mr-2 h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="Conference Room A or Address"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Meeting purpose and details..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Agenda */}
          <div className="space-y-2">
            <Label htmlFor="agenda">Agenda</Label>
            <Textarea
              id="agenda"
              placeholder="1. Introduction
2. Product Demo
3. Q&A"
              value={formData.agenda}
              onChange={(e) =>
                setFormData({ ...formData, agenda: e.target.value })
              }
              rows={4}
            />
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label>
              <Users className="inline-block mr-2 h-4 w-4" />
              Attendees
            </Label>
            <div className="space-y-2">
              {formData.attendees?.map((attendee, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                >
                  <span className="flex-1 text-sm">
                    {attendee.name || attendee.email}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttendee(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Email"
                  value={newAttendee.email}
                  onChange={(e) =>
                    setNewAttendee({ ...newAttendee, email: e.target.value })
                  }
                />
                <Input
                  placeholder="Name (optional)"
                  value={newAttendee.name}
                  onChange={(e) =>
                    setNewAttendee({ ...newAttendee, name: e.target.value })
                  }
                />
                <Button type="button" variant="outline" onClick={addAttendee}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Reminders */}
          <div className="space-y-2">
            <Label>
              <Clock className="inline-block mr-2 h-4 w-4" />
              Reminders
            </Label>
            <div className="space-y-2">
              {formData.reminders?.map((reminder, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={reminder.minutes}
                    onChange={(e) => {
                      const newReminders = [...(formData.reminders || [])];
                      newReminders[index].minutes = parseInt(e.target.value);
                      setFormData({ ...formData, reminders: newReminders });
                    }}
                    className="w-24"
                  />
                  <span className="text-sm">minutes before via</span>
                  <select
                    value={reminder.method}
                    onChange={(e) => {
                      const newReminders = [...(formData.reminders || [])];
                      newReminders[index].method = e.target.value as any;
                      setFormData({ ...formData, reminders: newReminders });
                    }}
                    className="border rounded px-3 py-2"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="NOTIFICATION">Notification</option>
                    <option value="POPUP">Popup</option>
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReminder(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addReminder}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Reminder
              </Button>
            </div>
          </div>

          {/* Google Calendar Options */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sync to Google Calendar</Label>
                <p className="text-sm text-gray-500">
                  Add this meeting to your Google Calendar
                </p>
              </div>
              <Switch
                checked={formData.syncToGoogle}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, syncToGoogle: checked })
                }
              />
            </div>

            {formData.syncToGoogle && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Add Google Meet Link</Label>
                  <p className="text-sm text-gray-500">
                    Automatically generate a video conference link
                  </p>
                </div>
                <Switch
                  checked={formData.addGoogleMeet}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, addGoogleMeet: checked })
                  }
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
