import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export const ChatChannelVisibility = ["public", "private"] as const;

export type ChatChannelVisibility = (typeof ChatChannelVisibility)[number];

export class CreateChannelDto {
  @ApiProperty({ description: "The channel name", example: "general" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

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
    example: "public",
    enum: ChatChannelVisibility,
    default: "public",
  })
  @IsIn(ChatChannelVisibility)
  @IsOptional()
  visibility?: ChatChannelVisibility;
}