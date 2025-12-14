import api from "../api";

// Tasks API
export const tasksApi = {
  // Get all tasks with filters
  getTasks: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    priority?: string;
    assignedToId?: string;
    companyId?: string;
    dealId?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
  }) => api.get("/tasks", { params }),

  // Get task by ID
  getTask: (id: string) => api.get(`/tasks/${id}`),

  // Create task
  createTask: (data: {
    title: string;
    description?: string;
    type: string;
    priority: string;
    estimatedHours?: number;
    dueDate?: string;
    companyId: string;
    dealId?: string;
    contactId?: string;
    activityId?: string;
    assignedToId?: string;
  }) => api.post("/tasks", data),

  // Update task
  updateTask: (id: string, data: any) => api.put(`/tasks/${id}`, data),

  // Delete task
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),

  // Assign task
  assignTask: (id: string, assignedToId: string) =>
    api.post(`/tasks/${id}/assign`, { assignedToId }),

  // Start task
  startTask: (id: string, notes?: string) =>
    api.post(`/tasks/${id}/start`, { notes }),

  // Complete task
  completeTask: (id: string, actualHours: number, notes?: string) =>
    api.post(`/tasks/${id}/complete`, { actualHours, notes }),

  // Update task status
  updateStatus: (
    id: string,
    status: string,
    notes?: string,
    hoursSpent?: number
  ) => api.put(`/tasks/${id}/status`, { status, notes, hoursSpent }),

  // Get task history
  getTaskHistory: (id: string) => api.get(`/tasks/${id}/history`),
};

// Employee Performance API
export const employeePerformanceApi = {
  // Get all employees with performance metrics
  getEmployees: (companyId?: string) =>
    api.get("/employees", { params: { companyId } }),

  // Get leaderboard
  getLeaderboard: (companyId?: string, limit?: number) =>
    api.get("/employees/leaderboard", { params: { companyId, limit } }),

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
      strengths?: string[];
      improvements?: string[];
    }
  ) => api.post(`/employees/${id}/review`, data),

  // Update employee skills
  updateSkills: (id: string, skillTags: string[]) =>
    api.put(`/employees/${id}/skills`, { skillTags }),

  // Update work capacity
  updateCapacity: (id: string, workCapacity: number) =>
    api.put(`/employees/${id}/capacity`, { workCapacity }),

  // Recalculate performance score
  recalculateScore: (id: string) =>
    api.post(`/employees/${id}/recalculate-score`),
};

// Work Assignment API
export const workAssignmentApi = {
  // Get AI suggestions for a task
  suggestEmployees: (taskId: string, requiredSkills?: string[]) =>
    api.post("/work-assignment/suggest", { taskId, requiredSkills }),

  // Auto-assign task to best employee
  autoAssignTask: (taskId: string, requiredSkills?: string[]) =>
    api.post("/work-assignment/auto-assign", { taskId, requiredSkills }),

  // Get pending suggestions
  getPendingSuggestions: (companyId?: string) =>
    api.get("/work-assignment/suggestions", { params: { companyId } }),

  // Get suggestions for a specific task
  getTaskSuggestions: (taskId: string) =>
    api.get(`/work-assignment/tasks/${taskId}/suggestions`),

  // Accept suggestion
  acceptSuggestion: (suggestionId: string) =>
    api.post("/work-assignment/accept", { suggestionId }),

  // Reject suggestion
  rejectSuggestion: (suggestionId: string, reason?: string) =>
    api.post("/work-assignment/reject", { suggestionId, reason }),
};

export default {
  tasks: tasksApi,
  employeePerformance: employeePerformanceApi,
  workAssignment: workAssignmentApi,
};
