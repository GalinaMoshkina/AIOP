import { Application } from 'ddd-tactical-core-boilerplate';

export class GetTodoQuery extends Application.Query {
  constructor(public readonly id: string) {
    super('Todo');
  }
}
