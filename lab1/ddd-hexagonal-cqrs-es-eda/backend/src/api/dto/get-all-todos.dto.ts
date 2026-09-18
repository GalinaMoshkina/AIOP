import { BadRequestException } from '@nestjs/common';
import { TodoStatus } from '@src/lib/bounded-contexts/todo/todo/ports/todo-read.repo-port';
import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({
    description: 'The last update timestamp of the todo',
    required: false,
  })
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
  @ApiProperty({ default: 1 })
  page: number;
  @ApiProperty({ default: 20 })
  limit: number;

  constructor(
    todos: TodoReadModel[],
    total: number,
    page: number,
    limit: number,
  ) {
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.items = todos.map((todo) => ({
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }
}

export function parseTodoListQuery(query: Record<string, unknown>) {
  const integer = (name: string, fallback: number, max: number): number => {
    const value = query[name];
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) {
      throw new BadRequestException(`${name} must be a positive integer`);
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
      throw new BadRequestException(`${name} is out of range`);
    }
    return parsed;
  };
  const page = integer('page', 1, Number.MAX_SAFE_INTEGER);
  const limit = integer('limit', 20, 100);
  const status = query.status === undefined ? 'all' : query.status;
  if (status !== 'all' && status !== 'completed' && status !== 'active') {
    throw new BadRequestException('Invalid status');
  }
  return { page, limit, status: status as TodoStatus };
}
