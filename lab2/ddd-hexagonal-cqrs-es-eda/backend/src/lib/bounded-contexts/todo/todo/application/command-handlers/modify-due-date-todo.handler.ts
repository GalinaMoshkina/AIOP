import {
  Application,
  Domain,
  Either,
  fail,
  ok,
} from 'ddd-tactical-core-boilerplate';
import { Inject } from '@nestjs/common';
import { Traceable } from '@lib/infra/telemetry';
import { ModifyTodoDueDateCommand } from '../../commands/modify-todo-due-date.command';
import { DueDateVO } from '../../domain/due-date.value-object';
import { DomainErrors } from '../../domain/errors';
import { TodoWriteRepoPort } from '../../ports/todo-write.repo-port';
import { TodoWriteRepoPortToken } from '../../constants';
import { ApplicationErrors } from '../errors';

type ModifyTodoDueDateResponse = Either<
  void,
  | DomainErrors.InvalidDueDateError
  | ApplicationErrors.TodoNotFoundError
  | Application.Repo.Errors.Unexpected
>;

export class ModifyTodoDueDateHandler
  implements
    Application.IUseCase<
      ModifyTodoDueDateCommand,
      Promise<ModifyTodoDueDateResponse>
    >
{
  constructor(
    @Inject(TodoWriteRepoPortToken)
    private readonly todoRepo: TodoWriteRepoPort,
  ) {}

  get command() {
    return ModifyTodoDueDateCommand;
  }

  get boundedContext() {
    return 'Todo';
  }

  @Traceable({
    operation: '[Todo] ModifyDueDateCommandHandler',
    serviceName: 'Todo',
    metrics: {
      name: '[Todo] ModifyDueDateCommandHandler',
      category: 'commandHandler',
    },
  })
  async execute(
    command: ModifyTodoDueDateCommand,
  ): Promise<ModifyTodoDueDateResponse> {
    const todoFound = await this.todoRepo.getById(new Domain.UUIDv4(command.id));
    if (todoFound.isFail()) {
      return fail(todoFound.value);
    }

    if (!todoFound.value) {
      return fail(new ApplicationErrors.TodoNotFoundError(command.id));
    }

    if (command.dueDate === null || command.dueDate === undefined) {
      todoFound.value.removeDueDate();
    } else {
      const dueDate = DueDateVO.create({ value: command.dueDate });
      if (dueDate.isFail()) {
        return fail(dueDate.value);
      }
      todoFound.value.setDueDate(dueDate.value);
    }

    const updateResult = await this.todoRepo.update(todoFound.value);
    if (updateResult.isFail()) {
      return fail(updateResult.value);
    }

    return ok();
  }
}
