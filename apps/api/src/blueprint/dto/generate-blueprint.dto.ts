import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class GenerateBlueprintDto {
  @ApiProperty({
    description:
      "Detailed description of the SaaS idea, audience, and problem it solves",
    example:
      "A platform that connects brands with UGC creators through fun, competitive contests...",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;
}
