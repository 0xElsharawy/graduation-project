import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";

export type TaskCommentMention = {
  userId: string;
  name: string;
  image: string | null;
};

export type TaskComment = {
  id: string;
  content: string;
  author: { id: string; name: string; image: string | null } | null;
  mentions: TaskCommentMention[];
  createdAt: string;
  updatedAt: string | null;
};

const base = (workspaceId: string, projectId: string, taskId: string) =>
  `${BACKEND_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`;

export const listTaskComments = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const res = await authFetch<{ comments: TaskComment[] }>(
    base(workspaceId, projectId, taskId),
    { method: "GET" }
  );
  return res.data;
};

export const createTaskComment = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  data: { content: string }
) => {
  const res = await authFetch<{ commentId: string }>(
    base(workspaceId, projectId, taskId),
    { method: "POST", data }
  );
  return res.data;
};

export const updateTaskComment = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  commentId: string,
  data: { content: string }
) => {
  const res = await authFetch<{ commentId: string }>(
    `${base(workspaceId, projectId, taskId)}/${commentId}`,
    { method: "PATCH", data }
  );
  return res.data;
};

export const deleteTaskComment = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  commentId: string
) => {
  const res = await authFetch<{ commentId: string }>(
    `${base(workspaceId, projectId, taskId)}/${commentId}`,
    { method: "DELETE" }
  );
  return res.data;
};
