import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export const ProjectStatus = [
  "backlog",
  "planned",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type ProjectStatus = (typeof ProjectStatus)[number];

export class CreateProjectDto {
  @ApiProperty({
    description: "The name of the project (max 32 characters)",
    example: "Project Name",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "The description of the project (max 255 characters)",
    example: "Project Description",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: "The status of the project",
    example: "backlog",
  })
  @IsEnum(ProjectStatus)
  @IsNotEmpty()
  status: ProjectStatus;

  @ApiProperty({
    description: "The priority of the project",
    example: 0,
  })
  @IsInt()
  @Min(0)
  @Max(4)
  @IsNotEmpty()
  priority: number;

  @ApiProperty({
    description: "The start date of the project",
    example: "2021-01-01",
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: "The end date of the project",
    example: "2021-01-01",
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: "The lead of the project",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsString()
  @IsOptional()
  leadId?: string;
}
