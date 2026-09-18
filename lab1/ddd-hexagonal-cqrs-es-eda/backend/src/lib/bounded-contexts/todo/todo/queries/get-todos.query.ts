import { Application } from 'ddd-tactical-core-boilerplate';

export type TodoStatus = 'all' | 'completed' | 'active';

export class GetTodosQuery extends Application.Query {
  constructor(
    public readonly page = 1,
    public readonly limit = 20,
    public readonly status: TodoStatus = 'all',
  ) {
    super('Todo');
  }
}
