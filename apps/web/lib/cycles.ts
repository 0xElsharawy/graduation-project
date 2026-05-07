import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";
import type { ProjectTask } from "./projects";

export type Cycle = {
  id: string;
  workspaceId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CycleSettings = {
  enabled: boolean;
  lengthDays: number;
  startDate: Date | null;
  isAdmin: boolean;
};

export type CycleWithTasks = {
  cycle: Cycle | null;
  tasks: ProjectTask[];
};

export type UpdateCycleSettingsData = {
  enabled: boolean;
  lengthDays?: number;
  startDate?: Date;
};

export const getCycleSettings = async (workspaceId: string) => {
  const res = await authFetch<CycleSettings>(
    `${BACKEND_URL}/workspaces/${workspaceId}/cycles/settings`,
    {
      method: "GET",
    }
  );
  return res.data;
};

export const updateCycleSettings = async (
  workspaceId: string,
  data: UpdateCycleSettingsData
) => {
  const res = await authFetch<CycleSettings>(
    `${BACKEND_URL}/workspaces/${workspaceId}/cycles/settings`,
    {
      method: "PUT",
      data,
    }
  );
  return res.data;
};

export const getCurrentCycle = async (workspaceId: string) => {
  const res = await authFetch<CycleWithTasks>(
    `${BACKEND_URL}/workspaces/${workspaceId}/cycles/current`,
    {
      method: "GET",
    }
  );
  return res.data;
};

export const getUpcomingCycle = async (workspaceId: string) => {
  const res = await authFetch<CycleWithTasks>(
    `${BACKEND_URL}/workspaces/${workspaceId}/cycles/upcoming`,
    {
      method: "GET",
    }
  );
  return res.data;
};
