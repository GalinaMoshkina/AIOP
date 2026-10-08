import { Application } from 'ddd-tactical-core-boilerplate';
import { GetTodosHandler } from '../../../application/query-handlers/get-todos.handler';
import { GetTodosQuery } from '../../../queries/get-todos.query';
import { TodoReadModelBuilder } from '../../builders/todo-read-model.builder';
import { mockAsyncLocalStorageGet } from '../../mocks/mockAsynLocalStorageGet.mock';
import { MockGetTodosReadRepo } from './get-todos-read-repo.mock';
import {
  GET_TODOS_EMPTY_ARRAY_CASE,
  GET_TODOS_REPO_ERROR_CASE,
  GET_TODOS_SUCCESS_CASE,
} from './get-todos.mock';

describe('Get todos feature test', () => {
  it('Get all todos successfully', async () => {
    const { userId, title, titleId, completed } = GET_TODOS_SUCCESS_CASE;
    mockAsyncLocalStorageGet(userId);

    // given
    const mockTodoReadRepo = new MockGetTodosReadRepo();
    const getTodosQuery = new GetTodosQuery();

    // when
    const getTodosHandler = new GetTodosHandler(
      mockTodoReadRepo.getMockTodoReadRepo(),
    );
    const result = await getTodosHandler.execute(getTodosQuery);

    //then
    const todoReadModel = new TodoReadModelBuilder()
      .withId(titleId)
      .withCompleted(completed)
      .withTitle(title)
      .withUserId(userId)
      .build();

    expect(mockTodoReadRepo.mockGetAllMethod).toHaveBeenCalled();
    expect(result.value).toEqual({ items: [todoReadModel.props], total: 1 });
  });

  it('Passes pagination and status filters to the read port', async () => {
    const { userId } = GET_TODOS_SUCCESS_CASE;
    mockAsyncLocalStorageGet(userId);

    const mockTodoReadRepo = new MockGetTodosReadRepo();
    const getTodosQuery = new GetTodosQuery(2, 10, 'active');

    const getTodosHandler = new GetTodosHandler(
      mockTodoReadRepo.getMockTodoReadRepo(),
    );
    await getTodosHandler.execute(getTodosQuery);

    expect(mockTodoReadRepo.mockGetAllMethod).toHaveBeenCalledWith({
      limit: 10,
      offset: 10,
      status: 'active',
    });
  });

  it('Get all todos successfully, empty array', async () => {
    const { userId } = GET_TODOS_EMPTY_ARRAY_CASE;
    mockAsyncLocalStorageGet(userId);

    // given
    const mockTodoReadRepo = new MockGetTodosReadRepo();
    const getTodosQuery = new GetTodosQuery();

    // when
    const getTodosHandler = new GetTodosHandler(
      mockTodoReadRepo.getMockTodoReadRepo(),
    );
    const result = await getTodosHandler.execute(getTodosQuery);

    //then
    expect(mockTodoReadRepo.mockGetAllMethod).toHaveBeenCalled();
    expect(result.value).toEqual({ items: [], total: 0 });
  });

  it('Failed to get all todos, repo error', async () => {
    const { userId } = GET_TODOS_REPO_ERROR_CASE;
    mockAsyncLocalStorageGet(userId);

    // given
    const mockTodoReadRepo = new MockGetTodosReadRepo();
    const getTodosQuery = new GetTodosQuery();

    // when
    const getTodosHandler = new GetTodosHandler(
      mockTodoReadRepo.getMockTodoReadRepo(),
    );
    const result = await getTodosHandler.execute(getTodosQuery);

    //then
    expect(mockTodoReadRepo.mockGetAllMethod).toHaveBeenCalled();
    expect(result.value).toBeInstanceOf(Application.Repo.Errors.Unexpected);
  });
});
