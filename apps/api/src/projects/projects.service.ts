import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { ok } from "@/common/response";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema/project";
import { attempt } from "@/lib/error-handling";
import { CreateProjectDto } from "./dto/create-project.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

@Injectable()
export class ProjectsService {
  async createProject(body: CreateProjectDto, workspaceId: string) {
    const [project, error] = await attempt(
      db
        .insert(projects)
        .values({
          name: body.name,
          description: body.description,
          status: body.status,
          workspaceId,
          priority: body.priority,
          startDate: body.startDate,
          endDate: body.endDate,
        })
        .returning({ id: projects.id })
    );
    if (error) {
      throw new InternalServerErrorException("Failed to create project");
    }
    return ok({ projectId: project?.[0]?.id });
  }

  async listProjects(workspaceId: string) {
    const [projectList, projectListError] = await attempt(
      db
        .select()
        .from(projects)
        .where(eq(projects.workspaceId, workspaceId))
        .orderBy(desc(projects.createdAt), desc(projects.priority))
    );
    if (projectListError) {
      throw new InternalServerErrorException("Failed to list projects");
    }
    return ok({ projects: projectList ?? [] });
  }

  async getProject(projectId: string) {
    const [project, projectError] = await attempt(
      db.select().from(projects).where(eq(projects.id, projectId))
    );
    if (projectError) {
      throw new InternalServerErrorException("Failed to get project");
    }
    if (!project?.[0]) {
      throw new NotFoundException("Project not found");
    }

    return ok({ project: project?.[0] });
  }

  async deleteProject(projectId: string) {
    const [project, projectError] = await attempt(
      db.delete(projects).where(eq(projects.id, projectId))
    );
    if (projectError) {
      throw new InternalServerErrorException("Failed to delete project");
    }

    return ok({ projectId: project?.[0]?.id });
  }

  async updateProject(projectId: string, body: UpdateProjectDto) {
    console.log("body", body);
    const [project, projectError] = await attempt(
      db
        .update(projects)
        .set({
          name: body.name,
          description: body.description,
          status: body.status,
          priority: body.priority,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
        })
        .where(eq(projects.id, projectId))
        .returning({ id: projects.id })
    );
    console.log("projectError", projectError);
    if (projectError) {
      throw new InternalServerErrorException("Failed to update project");
    }
    if (!project?.[0]) {
      throw new NotFoundException("Project not found");
    }

    return ok({ projectId: project?.[0]?.id });
  }

  async createTask(projectId: string, body: CreateTaskDto) {
    let dueDate: Date | undefined;
    if (body.dueDate) {
      dueDate = new Date(body.dueDate);
      if (dueDate.getTime() < Date.now() - 1000 * 60 * 60 * 24) {
        throw new BadRequestException("Due date must be in the future");
      }
    }
    const [project, projectError] = await attempt(
      db.select().from(projects).where(eq(projects.id, projectId))
    );
    if (projectError) {
      throw new InternalServerErrorException("Failed to get project");
    }
    if (!project?.[0]) {
      throw new NotFoundException("Project not found");
    }

    const [task, taskError] = await attempt(
      db
        .insert(tasks)
        .values({
          ...body,
          projectId,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        })
        .returning({ id: tasks.id })
    );
    console.log(taskError);
    if (taskError) {
      throw new InternalServerErrorException("Failed to create task");
    }
    return ok({ taskId: task?.[0]?.id });
  }

  async listTasks(projectId: string) {
    const [taskList, taskListError] = await attempt(
      db.select().from(tasks).where(eq(tasks.projectId, projectId))
    );
    if (taskListError) {
      throw new InternalServerErrorException("Failed to list tasks");
    }

    return ok({ tasks: taskList ?? [] });
  }

  async getTask(taskId: string) {
    const [task, taskError] = await attempt(
      db.select().from(tasks).where(eq(tasks.id, taskId))
    );
    if (taskError) {
      throw new InternalServerErrorException("Failed to get task");
    }
    if (!task?.[0]) {
      throw new NotFoundException("Task not found");
    }

    return ok({ task: task?.[0] });
  }

  async updateTask(taskId: string, body: UpdateTaskDto) {
    let dueDate: Date | undefined;
    if (body.dueDate) {
      dueDate = new Date(body.dueDate);
      if (dueDate.getTime() < Date.now() - 1000 * 60 * 60 * 24) {
        throw new BadRequestException("Due date must be in the future");
      }
    }

    const [task, taskError] = await attempt(
      db
        .update(tasks)
        .set({
          ...body,
          dueDate,
        })
        .where(eq(tasks.id, taskId))
    );
    if (taskError) {
      throw new InternalServerErrorException("Failed to update task");
    }

    return ok({ taskId: task?.[0]?.id });
  }

  async deleteTask(taskId: string) {
    const [task, taskError] = await attempt(
      db.delete(tasks).where(eq(tasks.id, taskId))
    );
    if (taskError) {
      throw new InternalServerErrorException("Failed to delete task");
    }

    return ok({ taskId: task?.[0]?.id });
  }
}
