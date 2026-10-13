import {
  Application,
  Either,
  fail,
  ok,
  Domain,
} from 'ddd-tactical-core-boilerplate';
import { RestoreTodoCommand } from '../../commands/restore-todo.command';
import { ApplicationErrors } from '../errors';
import { TodoWriteRepoPort } from '../../ports/todo-write.repo-port';
import { Traceable } from '@lib/infra/telemetry';
import { TodoReadModel } from '../../domain/todo.read-model';

type RestoreTodoUseCaseResponse = Either<
  TodoReadModel,
  ApplicationErrors.TodoNotFoundError
>;

export class RestoreTodoHandler
  implements
    Application.IUseCase<RestoreTodoCommand, Promise<RestoreTodoUseCaseResponse>>
{
  get command() {
    return RestoreTodoCommand;
  }

  get boundedContext() {
    return 'Todo';
  }
  constructor(private readonly todoRepo: TodoWriteRepoPort) {}

  @Traceable({
    operation: '[Todo] RestoreTodoCommandHandler',
    serviceName: 'Todo',
    metrics: {
      name: '[Todo] RestoreTodoCommandHandler',
      category: 'commandHandler',
    },
  })
  async execute(
    command: RestoreTodoCommand,
  ): Promise<RestoreTodoUseCaseResponse> {
    if (!this.todoRepo.getByIdIncludingDeleted) {
      throw new Error('Todo repository does not support restoring deleted todos');
    }

    const todo = await this.todoRepo.getByIdIncludingDeleted(new Domain.UUIDv4(command.id));
    if (todo.isFail()) {
      return fail(todo.value);
    }
    if (!todo.value || !todo.value.isDeleted) {
      return fail(new ApplicationErrors.TodoNotFoundError(command.id));
    }

    const restoreResult = todo.value.restore();
    if (restoreResult.isFail()) {
      return fail(new ApplicationErrors.TodoNotFoundError(command.id));
    }

    const updateResult = await this.todoRepo.update(todo.value);
    if (updateResult.isFail()) {
      return fail(updateResult.value);
    }

    const snapshot = todo.value.toPrimitives();
    return ok(
      TodoReadModel.fromPrimitives({
        id: snapshot.id,
        userId: snapshot.userId.id,
        title: snapshot.title.title,
        completed: snapshot.completed,
        deletedAt: snapshot.deletedAt,
      }),
    );
  }
}
