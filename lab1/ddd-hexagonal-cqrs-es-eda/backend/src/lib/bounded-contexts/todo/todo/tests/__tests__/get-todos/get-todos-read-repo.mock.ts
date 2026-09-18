import {
  Application,
  Either,
  ok,
  fail,
  asyncLocalStorage,
} from 'ddd-tactical-core-boilerplate';
import { TodoPage, TodoReadRepoPort } from '../../../ports/todo-read.repo-port';
import {
  GET_TODOS_REPO_ERROR_CASE,
  GET_TODOS_SUCCESS_CASE,
} from './get-todos.mock';

export class MockGetTodosReadRepo {
  private mockTodoReadRepo: TodoReadRepoPort;
  public readonly mockGetAllMethod: jest.Mock;

  constructor() {
    this.mockGetAllMethod = this.getMockGetAllMethod();
    this.mockTodoReadRepo = {
      getAll: this.mockGetAllMethod,
      getById: jest.fn(),
    };
  }

  public getMockTodoReadRepo(): TodoReadRepoPort {
    return this.mockTodoReadRepo;
  }

  private getMockGetAllMethod(): jest.Mock {
    return jest.fn(
      (): Promise<Either<TodoPage, Application.Repo.Errors.Unexpected>> => {
        const ctx = asyncLocalStorage.getStore()?.get('context');
        if (ctx.userId === GET_TODOS_SUCCESS_CASE.userId) {
          const { userId, title, titleId, completed } = GET_TODOS_SUCCESS_CASE;
          return Promise.resolve(
            ok({
              items: [{ userId, title, id: titleId, completed }],
              total: 1,
              page: 1,
              limit: 20,
            }),
          );
        } else if (ctx.userId === GET_TODOS_REPO_ERROR_CASE.userId) {
          return Promise.resolve(
            fail(new Application.Repo.Errors.Unexpected('Unexpected error')),
          );
        }
        return Promise.resolve(ok({ items: [], total: 0, page: 1, limit: 20 }));
      },
    );
  }
}
