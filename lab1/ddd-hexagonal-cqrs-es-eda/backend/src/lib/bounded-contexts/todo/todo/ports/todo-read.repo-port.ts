import { Application, Either } from 'ddd-tactical-core-boilerplate';
import {
  TodoReadModel,
  TTodoReadModelSnapshot,
} from '../domain/todo.read-model.js';
import { TodoStatusFilter } from '../queries/get-todos.query.js';

export type GetTodosResult = {
  items: TTodoReadModelSnapshot[];
  total: number;
};

export interface TodoReadRepoPort {
  getById(
    id: string,
  ): Promise<Either<TodoReadModel | null, Application.Repo.Errors.Unexpected>>;

  getAll(params?: {
    limit?: number;
    offset?: number;
    status?: TodoStatusFilter;
  }): Promise<
    Either<GetTodosResult, Application.Repo.Errors.Unexpected>
  >;
}
// export interface ITodoReadRepository {
//   findAll(): Promise<TodoReadModel[]>;
// }
