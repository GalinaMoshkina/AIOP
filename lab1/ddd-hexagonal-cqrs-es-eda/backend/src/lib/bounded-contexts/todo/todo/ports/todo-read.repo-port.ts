import { Application, Either } from 'ddd-tactical-core-boilerplate';
import { TTodoReadModelSnapshot } from '../domain/todo.read-model.js';

export type TodoStatus = 'all' | 'completed' | 'active';
export interface TodoPageOptions {
  page: number;
  limit: number;
  status: TodoStatus;
}
export interface TodoPage {
  items: TTodoReadModelSnapshot[];
  total: number;
  page: number;
  limit: number;
}
export interface TodoReadRepoPort extends Omit<
  Application.Repo.ICRUDReadPort<TTodoReadModelSnapshot>,
  'getAll'
> {
  getAll(
    params: TodoPageOptions,
  ): Promise<Either<TodoPage, Application.Repo.Errors.Unexpected>>;
}
