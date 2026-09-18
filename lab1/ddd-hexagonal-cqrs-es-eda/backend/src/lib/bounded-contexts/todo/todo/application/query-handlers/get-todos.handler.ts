import { Application, Either, ok, fail } from 'ddd-tactical-core-boilerplate';
import { Inject } from '@nestjs/common';
// import { QueryHandler } from '@nestjs/cqrs';
import { TodoReadRepoPort } from '../../ports/todo-read.repo-port';
import { GetTodosQuery } from '../../queries/get-todos.query';
import { Traceable } from '@lib/infra/telemetry';
import { TodoReadRepoPortToken } from '../../constants';
import { GetTodosResult } from '../../ports/todo-read.repo-port';

export type GetTodosQueryHandlerResponse = Either<
  GetTodosResult,
  Application.Repo.Errors.Unexpected
>;

export class GetTodosHandler
  implements Application.IQueryHandler<GetTodosQuery, GetTodosResult> {
  constructor(
    @Inject(TodoReadRepoPortToken)
    private readonly todoRepo: TodoReadRepoPort,
  ) { }

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
    const offset = (page - 1) * limit;
    const results = await this.todoRepo.getAll({ limit, offset, status });
    if (results.isFail()) return fail(results.value);
    return ok(results.value);
  }
}

// @QueryHandler(GetTodosQuery)
// export class GetTodosHandler
//   implements
//     Application.IQueryHandler<
//       GetTodosQuery,
//       Promise<GetTodosQueryHandlerResponse>
//     >
// {
//   get query() {
//     return GetTodosQuery;
//   }

//   get boundedContext() {
//     return 'Todo';
//   }
//   constructor(
//     @Inject(TodoReadRepoPortToken) private todoRepo: TodoReadRepoPort,
//   ) {}

//   async execute(query: GetTodosQuery): Promise<GetTodosQueryHandlerResponse> {
//     const todos = await this.todoRepo.getAll(query.ctx);
//     if (todos) return ok(todos);
//     return ok([]);
//   }
// }
