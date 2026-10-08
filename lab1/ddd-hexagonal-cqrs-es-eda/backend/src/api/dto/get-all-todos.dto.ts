import { ApiProperty } from '@nestjs/swagger';

export type TodoResponseItem = {
  id: string;
  title: string;
  completed: boolean;
};

export class TodoDto {
  @ApiProperty({ description: 'The unique identifier of the todo' })
  id: string;

  @ApiProperty({ description: 'The title of the todo' })
  title: string;

  @ApiProperty({ description: 'The completion status of the todo' })
  completed: boolean;

}

export class GetAllTodosResponseDto {
  @ApiProperty({
    type: [TodoDto],
    description: 'Array of todo items',
  })
  items: TodoDto[];

  @ApiProperty({ description: 'Total number of matching todos before pagination' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Current page size' })
  limit: number;

  constructor(params: {
    items: TodoResponseItem[];
    total: number;
    page: number;
    limit: number;
  }) {
    this.items = params.items.map((todo) => ({
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
    }));
    this.total = params.total;
    this.page = params.page;
    this.limit = params.limit;
  }
}
