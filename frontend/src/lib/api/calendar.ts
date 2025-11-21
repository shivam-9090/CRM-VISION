import { api } from "../api";

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  organizerId: string;
  companyId: string;
  contactId?: string;
  dealId?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    optional?: boolean;
  }>;
  googleEventId?: string;
  googleMeetLink?: string;
  agenda?: string;
  notes?: string;
  organizer?: {
    id: string;
    name: string;
    email: string;
  };
  contact?: any;
  deal?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  timeZone?: string;
  isAllDay?: boolean;
  dealId?: string;
  contactId?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    optional?: boolean;
  }>;
  reminders?: Array<{
    minutes: number;
    method: "EMAIL" | "NOTIFICATION" | "POPUP";
  }>;
  agenda?: string;
  syncToGoogle?: boolean;
  addGoogleMeet?: boolean;
}

export interface UpdateMeetingDto extends Partial<CreateMeetingDto> {
  status?: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
}

export const calendarApi = {
  // Google Calendar OAuth
  getGoogleAuthUrl: async (): Promise<{ url: string }> => {
    const response = await api.get("/calendar/google/auth-url");
    return response.data;
  },

  connectGoogleCalendar: async (
    code: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post("/calendar/google/connect", { code });
    return response.data;
  },

  // Meetings CRUD
  getMeetings: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<Meeting[]> => {
    const response = await api.get("/calendar/meetings", { params });
    return response.data;
  },

  getMeeting: async (id: string): Promise<Meeting> => {
    const response = await api.get(`/calendar/meetings/${id}`);
    return response.data;
  },

  createMeeting: async (data: CreateMeetingDto): Promise<Meeting> => {
    const response = await api.post("/calendar/meetings", data);
    return response.data;
  },

  updateMeeting: async (
    id: string,
    data: UpdateMeetingDto
  ): Promise<Meeting> => {
    const response = await api.put(`/calendar/meetings/${id}`, data);
    return response.data;
  },

  deleteMeeting: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/calendar/meetings/${id}`);
    return response.data;
  },
};
