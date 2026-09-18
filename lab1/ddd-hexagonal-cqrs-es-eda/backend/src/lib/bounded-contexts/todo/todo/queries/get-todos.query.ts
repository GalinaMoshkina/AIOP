import { Application } from 'ddd-tactical-core-boilerplate';

export type TodoStatusFilter = 'all' | 'completed' | 'active';

export class GetTodosQuery extends Application.Query {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly status: TodoStatusFilter = 'all',
  ) {
    super('Todo');
  }
}
