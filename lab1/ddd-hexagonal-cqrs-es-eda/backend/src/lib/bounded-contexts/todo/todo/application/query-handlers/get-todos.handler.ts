import { Application, Either, ok, fail } from 'ddd-tactical-core-boilerplate';
// import { QueryHandler } from '@nestjs/cqrs';
import {
  TodoListReadResult,
  TodoReadRepoPort,
} from '../../ports/todo-read.repo-port';
import { GetTodosQuery } from '../../queries/get-todos.query';
import { Traceable } from '@lib/infra/telemetry';

export type GetTodosQueryHandlerResponse = Either<
  TodoListReadResult,
  Application.Repo.Errors.Unexpected
>;

export class GetTodosHandler
  implements Application.IQueryHandler<GetTodosQuery, TodoListReadResult> {
  constructor(private readonly todoRepo: TodoReadRepoPort) {}

  get query() {
    return GetTodosQuery;
  }

  get boundedContext() {
    return 'Todo';
  }

  @Traceable({
    operation: '[Todo] GetTodosQueryHandler',
    serviceName: 'Todo',
    metrics: {
      name: '[Todo] GetTodosQueryHandler',
      category: 'queryHandler',
    },
  })
  async execute(query: GetTodosQuery): Promise<GetTodosQueryHandlerResponse> {
    const results = await this.todoRepo.getAll({
      limit: query.limit,
      offset: query.offset,
      status: query.status,
    });
    if (results.isFail()) return fail(results.value);
    return ok(results.value);
  }
}
