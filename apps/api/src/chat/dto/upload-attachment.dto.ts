import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class UploadAttachmentDto {
  @ApiProperty({
    description: "The public URL of the uploaded file",
    example: "https://cdn.example.com/file.pdf",
  })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({
    description: "The original file name",
    example: "file.pdf",
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: "The MIME type of the uploaded file",
    example: "application/pdf",
  })
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @ApiProperty({
    description: "The file size in bytes",
    example: 102400,
  })
  @IsInt()
  @Min(1)
  fileSize: number;
}