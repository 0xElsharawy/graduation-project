import { authFetch } from "./auth-fetch";
import { BACKEND_URL } from "./constants";

export type BlueprintFeasibility = {
  uniqueness: number;
  stickiness: number;
  growthTrend: number;
  pricingPotential: number;
  upsellPotential: number;
  customerPurchasingPower: number;
  overallScore: number;
};

export type BlueprintCoreFeature = {
  title: string;
  description: string;
};

export type BlueprintPricingTier = {
  tier: string;
  price: string;
  features: string[];
};

export type BlueprintTechStack = {
  frontend: string[];
  backend: string[];
  database: string[];
  ai: string[];
};

export type BlueprintUserFlow = {
  nodes: unknown[];
  edges: unknown[];
};

export type BlueprintPayload = {
  projectName: string;
  summary: string;
  feasibility: BlueprintFeasibility;
  improvementSuggestions: string[];
  coreFeatures: BlueprintCoreFeature[];
  techStack: BlueprintTechStack;
  pricingModel: BlueprintPricingTier[];
  ddl: string;
  userFlow: BlueprintUserFlow;
};

export type BlueprintRecord = {
  id: string;
  projectId: string;
  ideaDescription: string;
  blueprint: BlueprintPayload;
  status: "generating" | "completed" | "failed";
  createdAt: string;
};

export async function getBlueprint(workspaceId: string, projectId: string) {
  const res = await authFetch<{ blueprint: BlueprintRecord }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/projects/${projectId}/blueprint`,
    {
      method: "GET",
    }
  );

  return res.data.data.blueprint;
}

export async function convertBlueprintToTasks(
  workspaceId: string,
  projectId: string
) {
  const res = await authFetch<{ created: number }>(
    `${BACKEND_URL}/workspaces/${workspaceId}/projects/${projectId}/blueprint/convert-to-tasks`,
    {
      method: "POST",
    }
  );

  return res.data;
}
