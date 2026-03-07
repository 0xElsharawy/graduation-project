import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";

export type ProjectStatus =
  | "backlog"
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: number;
  startDate: Date;
  endDate: Date | null;
  workspaceId: string;
  createdAt: Date | null;
  updatedAt: Date;
};

export const listProjects = async (workspaceId: string) => {
  const res = await authFetch<{ projects: Project[] }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/projects`,
    {
      method: "GET",
    }
  );
  return res.data;
};

export type CreateProjectData = {
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: number;
};

export const createProject = async (
  workspaceId: string,
  data: CreateProjectData
) => {
  const res = await authFetch<{ projectId: string }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/projects`,
    {
      method: "POST",
      data,
    }
  );
  return res.data;
};

export const getProject = async (workspaceId: string, projectId: string) => {
  const res = await authFetch<{ project: Project }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/projects/${projectId}`,
    {
      method: "GET",
    }
  );
  return res.data;
};

export type UpdateProjectData = {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: number;
  startDate?: Date;
  endDate?: Date;
};

export const updateProject = async (
  workspaceId: string,
  projectId: string,
  data: UpdateProjectData
) => {
  const res = await authFetch<{ projectId: string }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/projects/${projectId}`,
    {
      method: "PUT",
      data,
    }
  );
  return res.data;
};

export const deleteProject = async (workspaceId: string, projectId: string) => {
  const res = await authFetch<{ projectId: string }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/projects/${projectId}`,
    {
      method: "DELETE",
    }
  );
  return res.data;
};

export type ProjectTask = {
  id: string;
  name: string;
  description?: string | null;
  projectId: string;
  assigneeId?: string;
  status: ProjectStatus;
  dueDate?: Date;
  priority: number;
  createdAt: Date;
};

export type CreateProjectTaskData = {
  name: string;
  status: ProjectStatus;
  priority: number;
  projectId: string;
  description?: string | null;
  assigneeId?: string;
  dueDate?: Date;
};

export const createProjectTask = async (
  workspaceId: string,
  projectId: string,
  data: CreateProjectTaskData
) => {
  const res = await authFetch<{ taskId: string }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks`,
    {
      method: "POST",
      data,
    }
  );
  return res.data;
};

export const getProjectTasks = async (
  workspaceId: string,
  projectId: string
) => {
  const res = await authFetch<{ tasks: ProjectTask[] }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks`,
    {
      method: "GET",
    }
  );
  return res.data;
};

export const getProjectTask = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const res = await authFetch<{ task: ProjectTask }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
    {
      method: "GET",
    }
  );
  return res.data;
};

export type UpdateProjectTaskData = {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: number;
  dueDate?: Date;
  assigneeId?: string;
};

export const updateProjectTask = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  data: UpdateProjectTaskData
) => {
  const res = await authFetch<{ taskId: string }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
    {
      method: "PUT",
      data,
    }
  );
  return res.data;
};
