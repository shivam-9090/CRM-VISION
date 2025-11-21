"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { calendarApi } from "@/lib/api/calendar";
import { toast } from "sonner";
import { Calendar, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface GoogleCalendarConnectProps {
  onConnectionChange?: (connected: boolean) => void;
}

export default function GoogleCalendarConnect({
  onConnectionChange,
}: GoogleCalendarConnectProps) {
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkConnectionStatus();

    // Listen for OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "GOOGLE_AUTH_SUCCESS") {
        setIsConnected(true);
        toast.success("Google Calendar connected successfully! 🎉");
        onConnectionChange?.(true);
      } else if (event.data.type === "GOOGLE_AUTH_ERROR") {
        toast.error("Failed to connect Google Calendar");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConnectionChange]);

  const checkConnectionStatus = async () => {
    try {
      setChecking(true);
      // TODO: Add API endpoint to check connection status
      // const status = await calendarApi.getGoogleConnectionStatus();
      // setIsConnected(status.connected);
    } catch (error) {
      console.error("Failed to check connection status:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const { url } = await calendarApi.getGoogleAuthUrl();

      // Open OAuth in popup window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        "Google Calendar OAuth",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
      );

      if (!popup) {
        toast.error("Please allow popups for this site");
        setLoading(false);
        return;
      }

      // Monitor popup
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          setLoading(false);
          checkConnectionStatus();
        }
      }, 500);
    } catch (error: any) {
      setLoading(false);
      toast.error(
        error.response?.data?.message || "Failed to initiate connection"
      );
    }
  };

  const handleDisconnect = async () => {
    // TODO: Implement disconnect functionality
    toast.info("Disconnect feature coming soon");
  };

  if (checking) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              Google Calendar Integration
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Sync your CRM meetings with Google Calendar and enable Google Meet
              links automatically.
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Connected
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    Not Connected
                  </span>
                </>
              )}
            </div>

            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled
              >
                Disconnect
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleConnect}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Google Calendar"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Features:</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                Two-way sync between CRM and Google Calendar
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                Automatic Google Meet link generation
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                Real-time updates across all devices
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                Mobile app sync (iOS & Android)
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">
                Automatic calendar invites for attendees
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        {!isConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After connecting, all your CRM meetings
              will automatically sync to your Google Calendar. You can also add
              events in Google Calendar (mobile or web), and they&apos;ll appear in
              your CRM.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
