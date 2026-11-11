import {
  Application,
  Either,
  fail,
  ok,
  Domain,
} from 'ddd-tactical-core-boilerplate';
import { Inject } from '@nestjs/common';
import { AddTodoCommand } from '../../commands/add-todo.command';
import { DomainErrors } from '../../domain/errors';
import { TitleVO } from '../../domain/title.value-object';
import { TodoEntity } from '../../domain/todo.entity';
import { TodoWriteRepoPort } from '../../ports/todo-write.repo-port';
import { TodoWriteRepoPortToken } from '../../constants';
import { UserIdVO } from '../../domain/user-id.value-object';
import { Traceable } from '@lib/infra/telemetry';
import { DueDateVO } from '../../domain/due-date.value-object';

type AddTodoUseCaseResponse = Either<
  string,
  | DomainErrors.InvalidDueDateError
  | DomainErrors.TitleOutOfBoundsError
  | Application.Repo.Errors.Unexpected
>;

export class AddTodoCommandHandler
  implements Application.ICommandHandler<AddTodoCommand, string>
{
  constructor(
    @Inject(TodoWriteRepoPortToken)
    private readonly todoRepo: TodoWriteRepoPort,
  ) {}

  get command() {
    return AddTodoCommand;
  }

  get boundedContext() {
    return 'Todo';
  }

  @Traceable({
    operation: '[Todo] AddTodoCommandHandler',
    serviceName: 'Todo',
    metrics: {
      name: '[Todo]AddTodoCommandHandler',
      category: 'commandHandler',
    },
  })
  async execute(command: AddTodoCommand): Promise<AddTodoUseCaseResponse> {
    const title = TitleVO.create({ title: command.title });
    if (title.isFail()) {
      return fail(title.value);
    }

    const userId = UserIdVO.create({
      id: new Domain.UUIDv4(command.metadata.context.userId),
    });
    let dueDate: DueDateVO | undefined;
    if (command.dueDate) {
      const dueDateResult = DueDateVO.create({ value: command.dueDate });
      if (dueDateResult.isFail()) {
        return fail(dueDateResult.value);
      }
      dueDate = dueDateResult.value;
    }
    const todo = TodoEntity.create({
      title: title.value,
      completed: false,
      userId: userId.value,
      dueDate,
    });
    if (todo.isFail()) {
      return fail(todo.value);
    }

    const createResult = await this.todoRepo.create(todo.value);
    if (createResult.isFail()) {
      return fail(createResult.value);
    }

    return ok(todo.value.id.toString());
  }
}
