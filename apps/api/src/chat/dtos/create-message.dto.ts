import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateMessageDto {
  @IsOptional()
  @IsUUID()
  parentMessageId?: string;

  @IsString()
  content!: string;
}
