import { type Todo } from '../../models/Todo';

type GetAllTodoSuccessResponse = {
  status: 'success';
  todos: Todo[];
  total: number;
  page: number;
  limit: number;
  error: undefined;
};

type GetAllTodoCachedResponse = {
  status: 'cached';
  todos: Todo[];
  total: number;
  page: number;
  limit: number;
  error: undefined;
};

type GetAllTodoErrorResponse = {
  status: 'error';
  error: string;
  todos: undefined;
};

export type GetAllTodoResponse =
  | GetAllTodoSuccessResponse
  | GetAllTodoCachedResponse
  | GetAllTodoErrorResponse;

export type TodoStatusFilter = 'all' | 'completed' | 'active';

export interface ITodoRepository {
  getAllTodo(page: number, limit: number, status?: TodoStatusFilter): Promise<GetAllTodoResponse>;
  modifyTodoTitle(id: string, title: string): Promise<void>;
  completeTodo(id: string): Promise<void>;
  uncompleteTodo(id: string): Promise<void>;
  deleteTodo(id: string): Promise<void>;
  addTodo(title: string): Promise<void>;
}
