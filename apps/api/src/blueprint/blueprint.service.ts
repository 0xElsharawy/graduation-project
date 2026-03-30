import { GoogleGenerativeAI } from "@google/generative-ai";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { Observable } from "rxjs";
import { ok } from "@/common/response";
import { db } from "@/db";
import { aiBlueprints, projects, tasks } from "@/db/schema";
import { attempt } from "@/lib/error-handling";
import { GenerateBlueprintDto } from "./dto/generate-blueprint.dto";

type BlueprintJson = {
  projectName: string;
  summary: string;
  feasibility: {
    uniqueness: number;
    stickiness: number;
    growthTrend: number;
    pricingPotential: number;
    upsellPotential: number;
    customerPurchasingPower: number;
    overallScore: number;
  };
  improvementSuggestions: string[];
  coreFeatures: { title: string; description: string }[];
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    ai: string[];
  };
  pricingModel: { tier: string; price: string; features: string[] }[];
  ddl: string;
  userFlow: {
    nodes: unknown[];
    edges: unknown[];
  };
};

@Injectable()
export class BlueprintService {
  private readonly gemini = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY ?? ""
  );
  private readonly geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  generateBlueprintStream(
    projectId: string,
    body: GenerateBlueprintDto
  ): Observable<MessageEvent> {
    const steps = [
      "Analyzing project description",
      "Evaluating market feasibility",
      "Identifying core features",
      "Determining technical requirements",
      "Generating database schema (DDL)",
      "Creating user flow diagram",
      "Finalizing blueprint",
    ];

    return new Observable<MessageEvent>((subscriber) => {
      async function run(this: BlueprintService) {
        try {
          for (const step of steps.slice(0, 3)) {
            subscriber.next(
              new MessageEvent("progress", {
                data: { step, status: "in_progress" },
              })
            );
          }

          const [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

          if (!project) {
            throw new InternalServerErrorException("Project not found");
          }

          const prompt = this.buildPrompt(project.name, body);

          const model = this.gemini.getGenerativeModel({
            model: this.geminiModel,
          });

          const result = await model.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          });

          const content = result.response.text();
          if (!content) {
            throw new InternalServerErrorException("Empty AI response");
          }

          const blueprintJson = JSON.parse(content) as BlueprintJson;

          const [record, error] = await attempt(
            db
              .insert(aiBlueprints)
              .values({
                projectId,
                ideaDescription: body.description,
                blueprint: blueprintJson,
                status: "completed",
              })
              .returning({ id: aiBlueprints.id })
          );

          if (error) {
            throw new InternalServerErrorException("Failed to save blueprint");
          }

          const blueprintId = record?.[0]?.id;

          for (const step of steps.slice(3)) {
            subscriber.next(
              new MessageEvent("progress", {
                data: { step, status: "completed" },
              })
            );
          }

          subscriber.next(
            new MessageEvent("done", {
              data: { done: true, blueprintId },
            })
          );
          subscriber.complete();
        } catch (err) {
          subscriber.error(this.normalizeGenerationError(err));
        }
      }

      run.call(this);
    });
  }

  async getLatestBlueprint(projectId: string) {
    const [rows, error] = await attempt(
      db
        .select()
        .from(aiBlueprints)
        .where(eq(aiBlueprints.projectId, projectId))
        .orderBy(desc(aiBlueprints.createdAt))
        .limit(1)
    );

    if (error) {
      throw new InternalServerErrorException("Failed to load blueprint");
    }

    return ok({ blueprint: rows?.[0] ?? null });
  }

  async convertBlueprintToTasks(projectId: string, workspaceId: string) {
    const [rows, error] = await attempt(
      db
        .select()
        .from(aiBlueprints)
        .where(eq(aiBlueprints.projectId, projectId))
        .orderBy(desc(aiBlueprints.createdAt))
        .limit(1)
    );

    if (error) {
      throw new InternalServerErrorException("Failed to load blueprint");
    }

    const record = rows?.[0];
    if (!record) {
      throw new InternalServerErrorException("No blueprint found to convert");
    }

    const blueprint = record.blueprint as BlueprintJson;

    const featureTasks: {
      name: string;
      description: string;
      workspaceId: string;
      projectId: string;
      status: "backlog" | "planned" | "in_progress" | "completed" | "cancelled";
      priority: number;
    }[] =
      blueprint.coreFeatures?.map((feature) => ({
        name: feature.title,
        description: feature.description,
        workspaceId,
        projectId,
        status: "backlog",
        priority: 0,
      })) ?? [];

    if (!featureTasks.length) {
      return ok({ created: 0 });
    }

    const [, insertError] = await attempt(
      db.insert(tasks).values(featureTasks)
    );

    if (insertError) {
      throw new InternalServerErrorException("Failed to create tasks");
    }

    return ok({ created: featureTasks.length });
  }

  private buildPrompt(
    projectTitle: string,
    body: GenerateBlueprintDto
  ): string {
    return [
      `Project title: ${projectTitle}`,
      `Description: ${body.description}`,
      "",
      "You MUST respond with a JSON object matching this TypeScript interface:",
      `{
  "projectName": string,
  "summary": string,
  "feasibility": {
    "uniqueness": number,
    "stickiness": number,
    "growthTrend": number,
    "pricingPotential": number,
    "upsellPotential": number,
    "customerPurchasingPower": number,
    "overallScore": number
  },
  "improvementSuggestions": string[],
  "coreFeatures": { "title": string, "description": string }[],
  "techStack": {
    "frontend": string[],
    "backend": string[],
    "database": string[],
    "ai": string[]
  },
  "pricingModel": { "tier": string, "price": string, "features": string[] }[],
  "ddl": string,
  "userFlow": {
    "nodes": any[],
    "edges": any[]
  }
}`,
      "",
      "The coreFeatures MUST be broken down into the smallest possible, actionable development tasks or features (e.g., 'Create user login API endpoint', 'Design database schema for users', 'Implement JWT authentication') rather than high-level epics.",
      "The ddl field MUST contain valid PostgreSQL DDL (CREATE TABLE statements) for the main entities of this SaaS.",
      "The userFlow field MUST contain nodes and edges formatted for @xyflow/react (React Flow) diagrams.",
      "Do not include any explanation outside of the JSON object.",
    ].join("\n");
  }

  private normalizeGenerationError(error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes("429 Too Many Requests") ||
        error.message.includes("Quota exceeded"))
    ) {
      return new InternalServerErrorException(
        `Gemini quota exceeded for model "${this.geminiModel}". Set GEMINI_MODEL to a lighter model such as "gemini-1.5-flash" or use an API key/project with available quota.`
      );
    }

    if (error instanceof Error && error.message.includes("API key")) {
      return new InternalServerErrorException(
        "Gemini API key is missing or invalid. Check GEMINI_API_KEY."
      );
    }

    return error;
  }
}
