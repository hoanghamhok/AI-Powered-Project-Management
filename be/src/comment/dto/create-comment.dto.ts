import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty(({ required: false }))
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty(({ required: false, type: [String] }))
  @IsOptional()
  @IsArray()
  mentions?: string[];
}