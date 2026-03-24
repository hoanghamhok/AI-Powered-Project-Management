import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AskDto {
  @IsString()
  @ApiProperty()
  question: string;

  @IsString()
  @ApiProperty()
  projectId: string;
}