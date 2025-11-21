import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  if (socket?.connected) {
    return socket;
  }

  // Get base URL without /api path
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const SOCKET_URL = apiUrl.replace("/api", "");

  socket = io(`${SOCKET_URL}/calendar`, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("✅ Calendar WebSocket connected");
  });

  socket.on("disconnect", () => {
    console.log("❌ Calendar WebSocket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return socket;
};

export const joinCompany = (companyId: string) => {
  if (socket?.connected) {
    socket.emit("join-company", companyId);
  }
};

export const leaveCompany = (companyId: string) => {
  if (socket?.connected) {
    socket.emit("leave-company", companyId);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Event listeners helpers
export const onMeetingCreated = (callback: (meeting: any) => void) => {
  socket?.on("meeting:created", callback);
};

export const onMeetingUpdated = (callback: (meeting: any) => void) => {
  socket?.on("meeting:updated", callback);
};

export const onMeetingDeleted = (callback: (data: { id: string }) => void) => {
  socket?.on("meeting:deleted", callback);
};

export const onMeetingReminder = (callback: (data: any) => void) => {
  socket?.on("meeting:reminder", callback);
};

// Cleanup listeners
export const offMeetingCreated = () => {
  socket?.off("meeting:created");
};

export const offMeetingUpdated = () => {
  socket?.off("meeting:updated");
};

export const offMeetingDeleted = () => {
  socket?.off("meeting:deleted");
};

export const offMeetingReminder = () => {
  socket?.off("meeting:reminder");
};
