import { Application, Either, ok, fail } from 'ddd-tactical-core-boilerplate';
import { Inject } from '@nestjs/common';
// import { QueryHandler } from '@nestjs/cqrs';
import { TodoReadRepoPort, TodoPage } from '../../ports/todo-read.repo-port';
import { GetTodosQuery } from '../../queries/get-todos.query';
import { Traceable } from '@lib/infra/telemetry';
import { TodoReadRepoPortToken } from '../../constants';

export type GetTodosQueryHandlerResponse = Either<
  TodoPage,
  Application.Repo.Errors.Unexpected
>;

export class GetTodosHandler
  implements Application.IQueryHandler<GetTodosQuery, TodoPage>
{
  constructor(
    @Inject(TodoReadRepoPortToken)
    private readonly todoRepo: TodoReadRepoPort,
  ) {}

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
    const { page, limit, status } = query;
    const results = await this.todoRepo.getAll({ page, limit, status });
    if (results.isFail()) return fail(results.value);
    return ok(results.value);
  }
}
