"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

interface WebSocketContextType {
  socket: Socket | null;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    // Don't connect if no token or user data
    if (!token || !user) {
      console.log("⚠️ No authentication data available, skipping WebSocket connection");
      return;
    }

    // Check if token is expired before attempting connection
    try {
      const base64Url = token.split('.')[1];
      if (base64Url) {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.log("⚠️ Token expired, skipping WebSocket connection");
          return;
        }
      }
    } catch (error) {
      console.log("⚠️ Invalid token format, skipping WebSocket connection");
      return;
    }

    // Connect to WebSocket server
    const newSocket = io("http://localhost:3001", {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on("connect", () => {
      console.log("✅ WebSocket connected");
      // Request unread count on connect
      newSocket.emit("getUnreadCount");
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 WebSocket disconnected:", reason);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error.message);
    });

    newSocket.on("notification", (notification: Notification) => {
      console.log("📬 New notification:", notification.title);
      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);
      
      // Show toast
      toast.success(notification.title, {
        duration: 4000,
        position: "top-right",
      });
    });

    newSocket.on("unreadCount", (count: number) => {
      console.log("📊 Unread count:", count);
      setUnreadCount(count);
    });

    newSocket.on("error", (error: any) => {
      const errorMessage = error?.message || error || 'Unknown error';
      
      // Only log meaningful errors (not "Unauthorized" spam)
      if (errorMessage !== "Unauthorized") {
        console.error("⚠️ WebSocket error:", errorMessage);
      }
      
      // Handle token expiration or authentication errors
      if (
        errorMessage === "Unauthorized" ||
        errorMessage?.includes("Token expired") || 
        errorMessage?.includes("expired") ||
        errorMessage?.includes("Authentication")
      ) {
        console.log("🔄 Authentication error - clearing WebSocket connection");
        
        // Only show toast if it's an explicit expiration (not just missing token)
        if (errorMessage?.includes("Token expired") || errorMessage?.includes("expired")) {
          toast.error("Session expired. Please login again.", {
            duration: 5000,
          });
        }
        
        newSocket.close();
        // Optionally redirect to login
        // window.location.href = "/auth/login";
      }
    });

    setSocket(newSocket);

    return () => {
      console.log("🧹 Cleaning up WebSocket connection");
      newSocket.close();
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/notifications/mark-all-read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/notifications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}
