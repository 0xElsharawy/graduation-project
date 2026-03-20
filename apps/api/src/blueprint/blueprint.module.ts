import { Module } from "@nestjs/common";
import { BlueprintController } from "./blueprint.controller";
import { BlueprintService } from "./blueprint.service";

@Module({
  controllers: [BlueprintController],
  providers: [BlueprintService],
})
export class BlueprintModule {}
