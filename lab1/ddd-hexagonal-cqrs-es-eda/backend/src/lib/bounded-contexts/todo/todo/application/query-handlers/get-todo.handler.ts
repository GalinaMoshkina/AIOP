import { Application, Either, fail, ok } from 'ddd-tactical-core-boilerplate';
import { Inject } from '@nestjs/common';
import { TTodoReadModelSnapshot } from '../../domain/todo.read-model';
import { TodoReadRepoPort } from '../../ports/todo-read.repo-port';
import { TodoReadRepoPortToken } from '../../constants';
import { GetTodoQuery } from '../../queries/get-todo.query';

export class GetTodoHandler
  implements Application.IQueryHandler<GetTodoQuery, TTodoReadModelSnapshot | null> {
  constructor(@Inject(TodoReadRepoPortToken) private readonly todoRepo: TodoReadRepoPort) {}

  get query() {
    return GetTodoQuery;
  }

  get boundedContext() {
    return 'Todo';
  }

  async execute(
    query: GetTodoQuery,
  ): Promise<Either<TTodoReadModelSnapshot | null, Application.Repo.Errors.Unexpected>> {
    const result = await this.todoRepo.getById(query.id);
    if (result.isFail()) return fail(result.value);
    return ok(result.value ? result.value.props : null);
  }
}
