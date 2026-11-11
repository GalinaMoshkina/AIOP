import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddTodoRequestDto {
  @ApiProperty({ description: 'The title of the todo' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Optional due date in YYYY-MM-DD format',
    required: false,
    example: '2026-10-15',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate?: string;
}
