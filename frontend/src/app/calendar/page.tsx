"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Plus,
  Calendar as CalendarIcon,
  Link as LinkIcon,
  Video,
  MapPin,
} from "lucide-react";
import { calendarApi, Meeting } from "@/lib/api/calendar";
import MeetingFormModal from "@/components/calendar/meeting-form-modal";
import GoogleCalendarConnect from "@/components/calendar/google-calendar-connect";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  initializeSocket,
  joinCompany,
  onMeetingCreated,
  onMeetingUpdated,
  onMeetingDeleted,
  onMeetingReminder,
  disconnectSocket,
} from "@/lib/socket";

export default function CalendarPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showGoogleConnect, setShowGoogleConnect] = useState(false);

  const loadMeetings = async () => {
    try {
      const data = await calendarApi.getMeetings();
      setMeetings(data);
    } catch (error) {
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();

    // Initialize WebSocket
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      const user = JSON.parse(userStr);
      const socket = initializeSocket(token);

      if (user.companyId) {
        joinCompany(user.companyId);
      }

      // Real-time event listeners
      onMeetingCreated((meeting) => {
        setMeetings((prev) => [...prev, meeting]);
        toast.success(`New meeting: ${meeting.title}`);
      });

      onMeetingUpdated((meeting) => {
        setMeetings((prev) =>
          prev.map((m) => (m.id === meeting.id ? meeting : m))
        );
        toast.info(`Meeting updated: ${meeting.title}`);
      });

      onMeetingDeleted(({ id }) => {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
        toast.info("Meeting deleted");
      });

      onMeetingReminder((data) => {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Meeting Reminder: ${data.meeting.title}`, {
            body: `Starting soon at ${format(
              new Date(data.meeting.startTime),
              "h:mm a"
            )}`,
            icon: "/logo.png",
          });
        }
        toast.info(`Meeting reminder: ${data.meeting.title}`);
      });
    }

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  const calendarEvents = meetings.map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    start: meeting.startTime,
    end: meeting.endTime,
    backgroundColor:
      meeting.status === "CANCELLED"
        ? "#ef4444"
        : meeting.status === "COMPLETED"
        ? "#10b981"
        : "#3b82f6",
    borderColor:
      meeting.status === "CANCELLED"
        ? "#dc2626"
        : meeting.status === "COMPLETED"
        ? "#059669"
        : "#2563eb",
    extendedProps: meeting,
  }));

  const handleEventClick = (info: any) => {
    setSelectedMeeting(info.event.extendedProps);
  };

  const handleDateSelect = (selectInfo: any) => {
    setShowMeetingModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-gray-500 mt-1">
            Manage your meetings and schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowGoogleConnect(!showGoogleConnect)}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Google Calendar
          </Button>
          <Button variant="primary" onClick={() => setShowMeetingModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Meeting
          </Button>
        </div>
      </div>

      {/* Google Calendar Connect */}
      {showGoogleConnect && (
        <GoogleCalendarConnect
          onConnectionChange={(connected) => {
            if (connected) {
              loadMeetings();
            }
          }}
        />
      )}

      <style>{`
        .fc .fc-button, .fc .fc-button.fc-button-active, .fc .fc-button:active, .fc .fc-button:focus, .fc .fc-button:hover {
          color: #fff !important;
        }
      `}</style>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 p-6">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="[&_.fc-button]:bg-blue-600 [&_.fc-button]:border-blue-600 [&_.fc-button]:text-white [&_.fc-button]:font-medium [&_.fc-button:hover]:bg-blue-700 [&_.fc-button-active]:bg-blue-800 [&_.fc-button-active]:text-white [&_.fc-today-button:disabled]:bg-gray-300 [&_.fc-today-button:disabled]:border-gray-300 [&_.fc-today-button:disabled]:text-gray-600 [&_.fc-toolbar-title]:text-gray-900">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={calendarEvents}
                eventClick={handleEventClick}
                selectable={true}
                select={handleDateSelect}
                height="auto"
                editable={true}
              />
            </div>
          )}
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Upcoming Meetings</h3>
            <div className="space-y-3">
              {meetings
                .filter(
                  (m) =>
                    new Date(m.startTime) > new Date() &&
                    m.status !== "CANCELLED"
                )
                .sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime()
                )
                .slice(0, 5)
                .map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedMeeting(meeting)}
                  >
                    <div className="font-medium text-sm">{meeting.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(meeting.startTime), "MMM dd, h:mm a")}
                    </div>
                    {meeting.googleMeetLink && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                        <Video className="h-3 w-3" />
                        <span>Google Meet</span>
                      </div>
                    )}
                  </div>
                ))}
              {meetings.filter((m) => new Date(m.startTime) > new Date())
                .length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming meetings
                </p>
              )}
            </div>
          </Card>

          {/* Selected Meeting Details */}
          {selectedMeeting && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Meeting Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMeeting(null)}
                >
                  ×
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">{selectedMeeting.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(
                      new Date(selectedMeeting.startTime),
                      "EEEE, MMMM dd, yyyy"
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(selectedMeeting.startTime), "h:mm a")} -{" "}
                    {format(new Date(selectedMeeting.endTime), "h:mm a")}
                  </p>
                </div>

                {selectedMeeting.description && (
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-gray-600">
                      {selectedMeeting.description}
                    </p>
                  </div>
                )}

                {selectedMeeting.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <p className="text-sm text-gray-600">
                      {selectedMeeting.location}
                    </p>
                  </div>
                )}

                {selectedMeeting.googleMeetLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      window.open(selectedMeeting.googleMeetLink!, "_blank")
                    }
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Join Google Meet
                  </Button>
                )}

                {selectedMeeting.agenda && (
                  <div>
                    <p className="text-sm font-medium mb-1">Agenda</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedMeeting.agenda}
                    </p>
                  </div>
                )}

                {selectedMeeting.attendees &&
                  selectedMeeting.attendees.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Attendees</p>
                      <div className="space-y-1">
                        {(selectedMeeting.attendees as any[]).map(
                          (attendee, i) => (
                            <p key={i} className="text-sm text-gray-600">
                              {attendee.name || attendee.email}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      try {
                        await calendarApi.deleteMeeting(selectedMeeting.id);
                        setSelectedMeeting(null);
                        loadMeetings();
                        toast.success("Meeting deleted");
                      } catch (error) {
                        toast.error("Failed to delete meeting");
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Meeting Form Modal */}
      <MeetingFormModal
        isOpen={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        onSuccess={loadMeetings}
      />
    </div>
  );
}
