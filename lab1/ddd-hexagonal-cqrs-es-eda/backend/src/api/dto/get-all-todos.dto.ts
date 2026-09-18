import { Transform } from 'class-transformer';
import { IsIn, IsInt, Min, Max } from 'class-validator';
import { TodoStatus } from '@src/lib/bounded-contexts/todo/todo/queries/get-todos.query';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TodoReadModel } from '@src/lib/bounded-contexts/todo/todo/domain/todo.read-model';

export class TodoDto {
  @ApiProperty({ description: 'The unique identifier of the todo' })
  id: string;

  @ApiProperty({ description: 'The title of the todo' })
  title: string;

  @ApiProperty({ description: 'The completion status of the todo' })
  completed: boolean;

  @ApiProperty({ description: 'The creation timestamp of the todo' })
  createdAt: number;

  @ApiProperty({ description: 'The last update timestamp of the todo', required: false })
  updatedAt?: number;
}

export class GetAllTodosResponseDto {
  @ApiProperty({
    type: [TodoDto],
    description: 'Array of todo items',
  })
  items: TodoDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  constructor(todos: TodoReadModel[], total: number, page: number, limit: number) {
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.items = todos.map(todo => ({
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }
}

// Reject empty, repeated, fractional and non-decimal query values.
const parseInteger = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && /^[0-9]+$/.test(value) ? Number(value) : value;

export class GetAllTodosRequestDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Transform(parseInteger)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Transform(parseInteger)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ default: 'all', enum: ['all', 'completed', 'active'] })
  @IsIn(['all', 'completed', 'active'])
  status: TodoStatus = 'all';
}
