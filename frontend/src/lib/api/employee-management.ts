import api from "../api";

// Tasks API (using activities with type TASK)
export const tasksApi = {
  // Get all tasks with filters
  getTasks: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    assignedToId?: string;
  }) => {
    const response = await api.get("/activities", {
      params: { ...params, type: "TASK" },
    });
    // Handle both array response and paginated response
    const data = response.data;
    return {
      data: Array.isArray(data)
        ? data
        : data.data || data.activities || [],
    };
  },

  // Get task by ID
  getTask: (id: string) => api.get(`/activities/${id}`),

  // Create task
  createTask: (data: {
    title: string;
    description?: string;
    type: string;
    status: string;
    scheduledDate?: string;
    contactId?: string;
    dealId?: string;
    assignedToId?: string;
  }) => api.post("/activities", { ...data, type: "TASK" }),

  // Update task
  updateTask: (id: string, data: any) => api.patch(`/activities/${id}`, data),

  // Delete task
  deleteTask: (id: string) => api.delete(`/activities/${id}`),
};

// Employee Performance API
export const employeePerformanceApi = {
  // Get all employees with performance metrics
  getEmployees: async (companyId?: string) => {
    const response = await api.get("/employees", { params: { companyId } });
    // Handle both array response and paginated response
    const data = response.data;
    return {
      data: Array.isArray(data) ? data : (data.data || data.employees || []),
    };
  },

  // Get leaderboard
  getLeaderboard: async (companyId?: string, limit?: number) => {
    const response = await api.get("/employees/leaderboard", {
      params: { companyId, limit },
    });
    const data = response.data;
    return {
      data: Array.isArray(data) ? data : (data.data || data.employees || []),
    };
  },

  // Get employee performance details
  getEmployeePerformance: (id: string) =>
    api.get(`/employees/${id}/performance`),

  // Get employee task history
  getEmployeeTaskHistory: (id: string, limit?: number) =>
    api.get(`/employees/${id}/tasks`, { params: { limit } }),

  // Create performance review
  createPerformanceReview: (
    id: string,
    data: {
      userId: string;
      reviewPeriodStart: string;
      reviewPeriodEnd: string;
      qualityScore: number;
      reviewNotes?: string;
    }
  ) => api.post(`/employees/${id}/review`, data),

  // Update skills
  updateSkills: (id: string, skillTags: string[]) =>
    api.put(`/employees/${id}/skills`, { skillTags }),

  // Update work capacity
  updateCapacity: (id: string, workCapacity: number) =>
    api.put(`/employees/${id}/capacity`, { workCapacity }),

  // Recalculate performance score
  recalculateScore: (id: string) =>
    api.post(`/employees/${id}/recalculate-score`),
};

const employeeManagementApi = {
  tasks: tasksApi,
  employeePerformance: employeePerformanceApi,
};

export default employeeManagementApi;
