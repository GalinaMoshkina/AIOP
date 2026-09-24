import { Application, Domain, Either, fail, ok } from 'ddd-tactical-core-boilerplate';
import { Inject } from '@nestjs/common';
import { RestoreTodoCommand } from '../../commands/restore-todo.command';
import { ApplicationErrors } from '../errors';
import { TodoWriteRepoPort } from '../../ports/todo-write.repo-port';
import { TodoWriteRepoPortToken } from '../../constants';
import { Traceable } from '@lib/infra/telemetry';

type RestoreTodoUseCaseResponse = Either<string, ApplicationErrors.TodoNotFoundError>;

export class RestoreTodoHandler
  implements Application.IUseCase<RestoreTodoCommand, Promise<RestoreTodoUseCaseResponse>> {
  get command() {
    return RestoreTodoCommand;
  }

  get boundedContext() {
    return 'Todo';
  }

  constructor(
    @Inject(TodoWriteRepoPortToken)
    private readonly todoRepo: TodoWriteRepoPort,
  ) {}

  @Traceable({
    operation: '[Todo] RestoreTodoCommandHandler',
    serviceName: 'Todo',
    metrics: { name: '[Todo] RestoreTodoCommandHandler', category: 'commandHandler' },
  })
  async execute(command: RestoreTodoCommand): Promise<RestoreTodoUseCaseResponse> {
    const todo = await this.todoRepo.getByIdIncludingDeleted(new Domain.UUIDv4(command.id));
    if (todo.isFail()) return fail(todo.value);
    if (!todo.value) return fail(new ApplicationErrors.TodoNotFoundError(command.id));

    const restoreResult = todo.value.restore();
    if (restoreResult.isFail()) {
      return fail(new ApplicationErrors.TodoNotFoundError(command.id));
    }

    const saveResult = await this.todoRepo.update(todo.value);
    if (saveResult.isFail()) return fail(saveResult.value);

    return ok(todo.value.id.toString());
  }
}
