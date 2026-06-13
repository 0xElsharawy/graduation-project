import { IsString } from "class-validator";

export class AddReactionDto {
  @IsString()
  emoji!: string;
}
