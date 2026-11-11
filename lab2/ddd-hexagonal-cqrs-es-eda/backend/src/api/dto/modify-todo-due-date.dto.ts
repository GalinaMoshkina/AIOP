import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class ModifyTodoDueDateRequestDto {
  @ApiProperty({
    description: 'Due date in YYYY-MM-DD format. Use null or omit to remove it.',
    required: false,
    nullable: true,
    example: '2026-10-15',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate?: string | null;
}
