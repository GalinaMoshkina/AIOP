import { Application } from 'ddd-tactical-core-boilerplate';

export type TodoListStatus = 'all' | 'completed' | 'active';

export class GetTodosQuery extends Application.Query {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly status: TodoListStatus = 'all',
  ) {
    super('Todo');
  }

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}
