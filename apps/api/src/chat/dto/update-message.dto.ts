import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateMessageDto {
  @ApiProperty({
    description: "The updated message content",
    example: "Updated message text.",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}