import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { ChatChannelVisibility } from "./create-channel.dto";

export class UpdateChannelDto {
  @ApiPropertyOptional({ description: "The channel name", example: "general" })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    description: "The channel description",
    example: "General workspace discussion",
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    description: "The channel visibility",
    example: "private",
    enum: ["public", "private"],
  })
  @IsIn(["public", "private"])
  @IsOptional()
  visibility?: ChatChannelVisibility;
}