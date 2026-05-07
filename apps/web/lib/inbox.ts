import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";

export type NotificationType =
  | "task_assigned"
  | "task_unassigned"
  | "task_status_changed"
  | "task_priority_changed"
  | "task_due_date_changed"
  | "task_added_to_cycle"
  | "task_removed_from_cycle"
  | "project_lead_assigned"
  | "task_comment_added"
  | "task_comment_mention";

export type InboxNotification = {
  id: string;
  type: NotificationType;
  actor: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  task: {
    id: string;
    name: string;
    projectId: string;
  } | null;
  project: {
    id: string;
    name: string;
  } | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export const listInboxNotifications = async (workspaceId: string) => {
  const res = await authFetch<{ notifications: InboxNotification[] }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/inbox`,
    { method: "GET" }
  );
  return res.data;
};

export const getInboxUnreadCount = async (workspaceId: string) => {
  const res = await authFetch<{ unread: number }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/inbox/count`,
    { method: "GET" }
  );
  return res.data;
};

export const markNotificationRead = async (
  workspaceId: string,
  notificationId: string
) => {
  const res = await authFetch<{ notificationId: string }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/inbox/${notificationId}/read`,
    { method: "PATCH" }
  );
  return res.data;
};

export const markNotificationUnread = async (
  workspaceId: string,
  notificationId: string
) => {
  const res = await authFetch<{ notificationId: string }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/inbox/${notificationId}/unread`,
    { method: "PATCH" }
  );
  return res.data;
};

export const markAllNotificationsRead = async (workspaceId: string) => {
  const res = await authFetch<{ success: boolean }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/inbox/mark-all-read`,
    { method: "POST" }
  );
  return res.data;
};

export const deleteNotification = async (
  workspaceId: string,
  notificationId: string
) => {
  const res = await authFetch<{ notificationId: string }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/inbox/${notificationId}`,
    { method: "DELETE" }
  );
  return res.data;
};

export const deleteReadNotifications = async (workspaceId: string) => {
  const res = await authFetch<{ success: boolean }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/inbox/read`,
    { method: "DELETE" }
  );
  return res.data;
};
