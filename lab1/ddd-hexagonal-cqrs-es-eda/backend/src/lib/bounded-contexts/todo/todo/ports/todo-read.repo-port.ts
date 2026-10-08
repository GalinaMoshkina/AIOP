import { Application, Either } from 'ddd-tactical-core-boilerplate';
import { TTodoReadModelSnapshot } from '../domain/todo.read-model.js';
import { TodoListStatus } from '../queries/get-todos.query';

export type TodoListReadResult = {
  items: TTodoReadModelSnapshot[];
  total: number;
};

export interface TodoReadRepoPort
  extends Application.Repo.ICRUDReadPort<TTodoReadModelSnapshot> {
  getAll(params?: {
    limit?: number;
    offset?: number;
    status?: TodoListStatus;
  }): Promise<
    Either<TodoListReadResult, Application.Repo.Errors.Unexpected>
  >;
}
// export interface ITodoReadRepository {
//   findAll(): Promise<TodoReadModel[]>;
// }
