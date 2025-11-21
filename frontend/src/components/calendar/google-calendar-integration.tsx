"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  Calendar,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { calendarApi } from "@/lib/api/calendar";
import { toast } from "sonner";

export function GoogleCalendarIntegration() {
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if we're returning from Google OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      handleOAuthCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    try {
      await calendarApi.connectGoogleCalendar(code);
      setIsConnected(true);
      toast.success("Google Calendar connected successfully!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to connect Google Calendar"
      );
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await calendarApi.getGoogleAuthUrl();
      window.location.href = url;
    } catch (error) {
      toast.error("Failed to initiate Google Calendar connection");
      setConnecting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            Google Calendar Integration
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Sync your CRM meetings with Google Calendar and automatically
            generate Google Meet links
          </p>

          {isConnected ? (
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Connected to Google Calendar</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <XCircle className="h-5 w-5" />
              <span>Not connected</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="text-sm space-y-2">
              <h4 className="font-medium">Features:</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Automatic 2-way sync with Google Calendar</li>
                <li>Auto-generate Google Meet video links</li>
                <li>Receive meeting reminders</li>
                <li>Update meetings from either platform</li>
              </ul>
            </div>

            <Button
              onClick={handleConnect}
              disabled={connecting || isConnected}
              className="w-full sm:w-auto"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              {isConnected
                ? "Connected"
                : connecting
                ? "Connecting..."
                : "Connect Google Calendar"}
            </Button>

            {isConnected && (
              <p className="text-xs text-gray-500 mt-2">
                To disconnect, remove CRM access from your{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Account Settings
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
