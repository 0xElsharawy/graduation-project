import { IsOptional, IsString, IsBoolean } from "class-validator";

export class CreateChannelDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
