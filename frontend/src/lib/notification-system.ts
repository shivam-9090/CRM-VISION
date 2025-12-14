// Notification System for Task Management

export interface Notification {
  id: string;
  userId: string;
  type:
    | "task_assigned"
    | "task_verified"
    | "task_rejected"
    | "points_awarded"
    | "deadline_approaching"
    | "task_overdue";
  title: string;
  message: string;
  taskId?: string;
  relatedUserId?: string;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

export const notificationTemplates = {
  task_assigned: (taskTitle: string, managerName: string) => ({
    title: "New Task Assigned",
    message: `${managerName} assigned you the task "${taskTitle}"`,
  }),

  task_verified_approved: (taskTitle: string, points: number) => ({
    title: "✅ Task Verified!",
    message: `"${taskTitle}" has been approved! You earned ${points} points.`,
  }),

  task_verified_rejected: (taskTitle: string, feedback: string) => ({
    title: "⚠️ Task Needs Revision",
    message: `"${taskTitle}" was not approved. Feedback: "${feedback}"`,
  }),

  points_awarded: (points: number, taskTitle: string) => ({
    title: "🎉 Points Awarded!",
    message: `You received ${points} points for completing "${taskTitle}"`,
  }),

  deadline_approaching: (taskTitle: string, daysLeft: number) => ({
    title: "⏰ Deadline Approaching",
    message: `"${taskTitle}" is due in ${daysLeft} day${
      daysLeft > 1 ? "s" : ""
    }`,
  }),

  task_overdue: (taskTitle: string) => ({
    title: "🚨 Task Overdue",
    message: `"${taskTitle}" is now overdue. Please complete it urgently.`,
  }),

  employee_submitted_task: (employeeName: string, taskTitle: string) => ({
    title: "Task Awaiting Verification",
    message: `${employeeName} submitted "${taskTitle}" for your review`,
  }),
};

// Store notifications in localStorage for demo
export const notificationService = {
  // Get all notifications
  getNotifications: async (userId: string) => {
    const stored = localStorage.getItem(`notifications_${userId}`);
    return stored ? JSON.parse(stored) : [];
  },

  // Add a notification
  addNotification: async (
    userId: string,
    notification: Omit<Notification, "id" | "createdAt">
  ) => {
    const notifications = await notificationService.getNotifications(userId);
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    notifications.push(newNotification);
    localStorage.setItem(
      `notifications_${userId}`,
      JSON.stringify(notifications)
    );
    return newNotification;
  },

  // Mark as read
  markAsRead: async (userId: string, notificationId: string) => {
    const notifications = await notificationService.getNotifications(userId);
    const updated = notifications.map((n: Notification) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
  },

  // Delete notification
  deleteNotification: async (userId: string, notificationId: string) => {
    const notifications = await notificationService.getNotifications(userId);
    const filtered = notifications.filter(
      (n: Notification) => n.id !== notificationId
    );
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(filtered));
  },

  // Get unread count
  getUnreadCount: async (userId: string) => {
    const notifications = await notificationService.getNotifications(userId);
    return notifications.filter((n: Notification) => !n.read).length;
  },

  // Clear all
  clearAll: async (userId: string) => {
    localStorage.removeItem(`notifications_${userId}`);
  },
};

// Notification channels
export const sendNotification = (
  userId: string,
  type: Notification["type"],
  details: Record<string, any>
) => {
  const templates: Record<string, any> = {
    task_assigned: notificationTemplates.task_assigned(
      details.taskTitle,
      details.managerName
    ),
    task_verified: details.approved
      ? notificationTemplates.task_verified_approved(
          details.taskTitle,
          details.points
        )
      : notificationTemplates.task_verified_rejected(
          details.taskTitle,
          details.feedback
        ),
    points_awarded: notificationTemplates.points_awarded(
      details.points,
      details.taskTitle
    ),
    deadline_approaching: notificationTemplates.deadline_approaching(
      details.taskTitle,
      details.daysLeft
    ),
    task_overdue: notificationTemplates.task_overdue(details.taskTitle),
  };

  const template = templates[type];
  if (template) {
    notificationService.addNotification(userId, {
      type,
      title: template.title,
      message: template.message,
      userId,
      taskId: details.taskId,
      relatedUserId: details.relatedUserId,
      read: false,
    });
  }
};
