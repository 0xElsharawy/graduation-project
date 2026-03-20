import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Sse,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { BlueprintService } from "./blueprint.service";
import { GenerateBlueprintDto } from "./dto/generate-blueprint.dto";

@Controller("/workspaces/:workspaceId/projects/:projectId/blueprint")
export class BlueprintController {
  constructor(private readonly blueprintService: BlueprintService) {}

  @Sse("generate")
  generate(
    @Param("projectId", ParseUUIDPipe) projectId: string,
    @Query() query: GenerateBlueprintDto
  ): Observable<MessageEvent> {
    return this.blueprintService.generateBlueprintStream(projectId, query);
  }

  @Get()
  async getBlueprint(
    @Param("projectId", ParseUUIDPipe) projectId: string,
  ) {
    return await this.blueprintService.getLatestBlueprint(projectId);
  }

  @Post("convert-to-tasks")
  async convertToTasks(
    @Param("workspaceId", ParseUUIDPipe) workspaceId: string,
    @Param("projectId", ParseUUIDPipe) projectId: string
  ) {
    return await this.blueprintService.convertBlueprintToTasks(
      projectId,
      workspaceId
    );
  }
}
