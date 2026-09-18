import { type Todo } from '../../models/Todo';
export type TodoStatus = 'all' | 'completed' | 'active';
export type TodoPage = {
  items: Todo[];
  total: number;
  page: number;
  limit: number;
};
export type GetAllTodoResponse =
  ({ status: 'success'; error: undefined } & TodoPage) | { status: 'error'; error: string };
export interface ITodoRepository {
  getAllTodo(page?: number, limit?: number, status?: TodoStatus): Promise<GetAllTodoResponse>;
  modifyTodoTitle(id: string, title: string): Promise<void>;
  completeTodo(id: string): Promise<void>;
  uncompleteTodo(id: string): Promise<void>;
  deleteTodo(id: string): Promise<void>;
  addTodo(title: string): Promise<void>;
}
