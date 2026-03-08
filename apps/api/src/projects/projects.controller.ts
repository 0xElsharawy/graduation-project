import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from "@nestjs/common";
import { CreateProjectDto } from "./dto/create-project.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { ProjectsService } from "./projects.service";

@Controller("/workspaces/:workspaceId/projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async createProject(
    @Body() body: CreateProjectDto,
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string
  ) {
    return await this.projectsService.createProject(body, workspaceId);
  }

  @Get()
  async listProjects(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
  ) {
    return await this.projectsService.listProjects(workspaceId);
  }

  @Get(":projectId")
  async getProject(
    @Param("projectId", ParseUUIDPipe) projectId: string,
  ) {
    return await this.projectsService.getProject(projectId);
  }

  @Delete(":projectId")
  async deleteProject(
    @Param("projectId", ParseUUIDPipe) projectId: string,
  ) {
    return await this.projectsService.deleteProject(projectId);
  }

  @Put(":projectId")
  async updateProject(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() body: UpdateProjectDto
  ) {
    return await this.projectsService.updateProject(projectId, body);
  }

  @Post(":projectId/tasks")
  async createTask(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Body() body: CreateTaskDto
  ) {
    return await this.projectsService.createTask(workspaceId, projectId, body);
  }

  @Get(":projectId/tasks")
  async listTasks(
    @Param("projectId", ParseUUIDPipe) projectId: string,
  ) {
    return await this.projectsService.listTasks(projectId);
  }

  @Get("/:projectId/tasks/:taskId")
  async getTask(
    @Param("taskId", ParseUUIDPipe) taskId: string,
  ) {
    return await this.projectsService.getTask(taskId);
  }

  @Put("/:projectId/tasks/:taskId")
  async updateTask(
    @Param("taskId", ParseUUIDPipe) taskId: string,
    @Body() body: UpdateTaskDto
  ) {
    return await this.projectsService.updateTask(taskId, body);
  }

  @Delete("/:projectId/tasks/:taskId")
  async deleteTask(
    @Param("taskId", ParseUUIDPipe) taskId: string,
  ) {
    return await this.projectsService.deleteTask(taskId);
  }
}
