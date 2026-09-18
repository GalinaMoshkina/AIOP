import { Application, Either } from 'ddd-tactical-core-boilerplate';
import { TTodoReadModelSnapshot } from '../domain/todo.read-model';
import { TodoStatus } from '../queries/get-todos.query';

export interface TodoPage {
  items: TTodoReadModelSnapshot[];
  total: number;
  page: number;
  limit: number;
}

export interface TodoReadRepoPort
  extends Omit<Application.Repo.ICRUDReadPort<TTodoReadModelSnapshot>, 'getAll'> {
  getAll(params: {
    page: number;
    limit: number;
    status: TodoStatus;
  }): Promise<Either<TodoPage, Application.Repo.Errors.Unexpected>>;
}
