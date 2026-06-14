import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateMessageDto {
  @ApiProperty({
    description: "The message content",
    example: "Hello, team.",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}