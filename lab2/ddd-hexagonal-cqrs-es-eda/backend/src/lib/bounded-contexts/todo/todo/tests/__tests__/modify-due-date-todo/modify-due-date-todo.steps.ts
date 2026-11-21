import {
  Application,
  Domain,
  fail,
  ok,
} from 'ddd-tactical-core-boilerplate';
import { ModifyTodoDueDateHandler } from '@src/lib/bounded-contexts/todo/todo/application/command-handlers/modify-due-date-todo.handler';
import { ApplicationErrors } from '@src/lib/bounded-contexts/todo/todo/application/errors';
import { ModifyTodoDueDateCommand } from '@src/lib/bounded-contexts/todo/todo/commands/modify-todo-due-date.command';
import { DomainErrors } from '@src/lib/bounded-contexts/todo/todo/domain/errors';
import { TodoDueDateRemovedDomainEvent } from '@src/lib/bounded-contexts/todo/todo/domain/events/todo-due-date-removed.event';
import { TodoDueDateSetDomainEvent } from '@src/lib/bounded-contexts/todo/todo/domain/events/todo-due-date-set.event';
import { TodoEntity } from '@src/lib/bounded-contexts/todo/todo/domain/todo.entity';
import { TodoWriteRepoPort } from '@src/lib/bounded-contexts/todo/todo/ports/todo-write.repo-port';

const userId = { id: '10000000-0000-4000-8000-000000000003' };
const todoId = '10000000-0000-4000-8000-000000000004';

function todoWithDueDate(dueDate?: string | null): TodoEntity {
  return TodoEntity.fromPrimitives({
    id: todoId,
    userId,
    title: { title: 'Buy groceries' },
    completed: false,
    dueDate,
  });
}

class ModifyDueDateWriteRepo {
  public readonly mockGetByIdMethod = jest.fn();
  public readonly mockUpdateMethod = jest.fn();

  constructor(todo: TodoEntity | null = todoWithDueDate()) {
    this.mockGetByIdMethod.mockResolvedValue(ok(todo));
    this.mockUpdateMethod.mockResolvedValue(ok());
  }

  getMockTodoWriteRepo(): TodoWriteRepoPort {
    return {
      create: jest.fn(),
      getById: this.mockGetByIdMethod,
      update: this.mockUpdateMethod,
      delete: jest.fn(),
    };
  }
}

describe('Modify todo due date feature test', () => {
  it('sets a due date when none is set', async () => {
    const repo = new ModifyDueDateWriteRepo(todoWithDueDate());
    const handler = new ModifyTodoDueDateHandler(repo.getMockTodoWriteRepo());

    const result = await handler.execute(
      new ModifyTodoDueDateCommand({ id: todoId, dueDate: '2026-10-15' }),
    );

    expect(repo.mockGetByIdMethod).toHaveBeenCalledWith(new Domain.UUIDv4(todoId));
    expect(repo.mockUpdateMethod).toHaveBeenCalledWith(expect.any(TodoEntity));
    const todoAggregate = repo.mockUpdateMethod.mock.calls[0][0];
    expect(todoAggregate.toPrimitives()).toMatchObject({
      id: todoId,
      dueDate: '2026-10-15',
    });
    expect(todoAggregate.domainEvents[0]).toBeInstanceOf(
      TodoDueDateSetDomainEvent,
    );
    expect(result.value).toBe(undefined);
  });

  it('changes an existing due date', async () => {
    const repo = new ModifyDueDateWriteRepo(todoWithDueDate('2026-10-15'));
    const handler = new ModifyTodoDueDateHandler(repo.getMockTodoWriteRepo());

    await handler.execute(
      new ModifyTodoDueDateCommand({ id: todoId, dueDate: '2026-10-20' }),
    );

    const todoAggregate = repo.mockUpdateMethod.mock.calls[0][0];
    expect(todoAggregate.toPrimitives().dueDate).toBe('2026-10-20');
    expect(todoAggregate.domainEvents[0]).toBeInstanceOf(
      TodoDueDateSetDomainEvent,
    );
  });

  it('removes an existing due date without changing unrelated data', async () => {
    const repo = new ModifyDueDateWriteRepo(todoWithDueDate('2026-10-15'));
    const handler = new ModifyTodoDueDateHandler(repo.getMockTodoWriteRepo());

    await handler.execute(
      new ModifyTodoDueDateCommand({ id: todoId, dueDate: null }),
    );

    const todoAggregate = repo.mockUpdateMethod.mock.calls[0][0];
    expect(todoAggregate.toPrimitives()).toEqual({
      id: todoId,
      userId,
      title: { title: 'Buy groceries' },
      completed: false,
      dueDate: null,
    });
    expect(todoAggregate.domainEvents[0]).toBeInstanceOf(
      TodoDueDateRemovedDomainEvent,
    );
  });

  it('safely handles removing a due date when none is set', async () => {
    const repo = new ModifyDueDateWriteRepo(todoWithDueDate());
    const handler = new ModifyTodoDueDateHandler(repo.getMockTodoWriteRepo());

    const result = await handler.execute(
      new ModifyTodoDueDateCommand({ id: todoId, dueDate: null }),
    );

    const todoAggregate = repo.mockUpdateMethod.mock.calls[0][0];
    expect(todoAggregate.toPrimitives().dueDate).toBeNull();
    expect(result.value).toBe(undefined);
  });

  it('rejects an invalid due date', async () => {
    const repo = new ModifyDueDateWriteRepo(todoWithDueDate());
    const handler = new ModifyTodoDueDateHandler(repo.getMockTodoWriteRepo());

    const result = await handler.execute(
      new ModifyTodoDueDateCommand({ id: todoId, dueDate: '2026/10/15' }),
    );

    expect(repo.mockUpdateMethod).not.toHaveBeenCalled();
    expect(result.value).toBeInstanceOf(DomainErrors.InvalidDueDateError);
  });

  it('rejects a missing todo', async () => {
    const repo = new ModifyDueDateWriteRepo(null);
    const handler = new ModifyTodoDueDateHandler(repo.getMockTodoWriteRepo());

    const result = await handler.execute(
      new ModifyTodoDueDateCommand({ id: todoId, dueDate: '2026-10-15' }),
    );

    expect(repo.mockUpdateMethod).not.toHaveBeenCalled();
    expect(result.value).toBeInstanceOf(ApplicationErrors.TodoNotFoundError);
  });

  it('rejects repository ownership errors before updating the todo', async () => {
    const repo = new ModifyDueDateWriteRepo(todoWithDueDate('2026-10-15'));
    repo.mockGetByIdMethod.mockResolvedValue(
      fail(new Application.Repo.Errors.Unexpected('Unexpected error')),
    );
    const handler = new ModifyTodoDueDateHandler(repo.getMockTodoWriteRepo());

    const result = await handler.execute(
      new ModifyTodoDueDateCommand({ id: todoId, dueDate: '2026-10-20' }),
    );

    expect(repo.mockUpdateMethod).not.toHaveBeenCalled();
    expect(result.value).toBeInstanceOf(Application.Repo.Errors.Unexpected);
  });
});
