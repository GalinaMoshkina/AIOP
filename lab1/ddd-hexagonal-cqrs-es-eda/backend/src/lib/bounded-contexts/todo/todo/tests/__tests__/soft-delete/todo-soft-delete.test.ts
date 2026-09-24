import { Domain } from 'ddd-tactical-core-boilerplate';
import { TodoEntity, TodoEventPayload, TodoEventType } from '../../../domain/todo.entity';
import { TitleVO } from '../../../domain/title.value-object';
import { UserIdVO } from '../../../domain/user-id.value-object';

describe('Todo soft delete', () => {
  const createTodo = () =>
    TodoEntity.create({
      userId: UserIdVO.create({ id: new Domain.UUIDv4() }).value as UserIdVO,
      title: TitleVO.create({ title: 'Test todo' }).value as TitleVO,
      completed: false,
    }).value as TodoEntity;

  it('marks a todo as deleted and emits TodoSoftDeletedDomainEvent', () => {
    const todo = createTodo();
    todo.commit(1);

    const result = todo.markAsDeleted();

    expect(result.isOk()).toBe(true);
    expect(todo.deletedAt).toBeInstanceOf(Date);
    expect(todo.domainEvents[0].constructor.name).toBe('TodoSoftDeletedDomainEvent');
    expect(todo.domainEvents[0].payload.deletedAt).toBe(todo.deletedAt?.toISOString());
  });

  it('cannot delete an already deleted todo', () => {
    const todo = createTodo();
    todo.commit(1);
    todo.markAsDeleted();
    todo.commit(2);

    const result = todo.markAsDeleted();

    expect(result.isFail()).toBe(true);
  });

  it('restores a deleted todo and emits TodoRestoredDomainEvent', () => {
    const todo = createTodo();
    todo.commit(1);
    todo.markAsDeleted();
    todo.commit(2);

    const result = todo.restore();

    expect(result.isOk()).toBe(true);
    expect(todo.deletedAt).toBeNull();
    expect(todo.domainEvents[0].constructor.name).toBe('TodoRestoredDomainEvent');
    expect(todo.domainEvents[0].payload.deletedAt).toBeNull();
  });

  it('cannot restore a todo that is not deleted', () => {
    const todo = createTodo();

    const result = todo.restore();

    expect(result.isFail()).toBe(true);
  });

  it('rehydrates soft-delete and restore history', () => {
    const todo = createTodo();
    const added = todo.domainEvents[0] as Domain.DomainEvent<TodoEventPayload>;
    todo.commit(1);

    todo.markAsDeleted();
    const deleted = todo.domainEvents[0] as Domain.DomainEvent<TodoEventPayload>;
    todo.commit(2);

    todo.restore();
    const restored = todo.domainEvents[0] as Domain.DomainEvent<TodoEventPayload>;
    todo.commit(3);

    const rehydrated = TodoEntity.fromHistory([
      { eventType: added.constructor.name as TodoEventType, payload: added.payload, version: 1 },
      { eventType: deleted.constructor.name as TodoEventType, payload: deleted.payload, version: 2 },
      { eventType: restored.constructor.name as TodoEventType, payload: restored.payload, version: 3 },
    ]);

    expect(rehydrated.deletedAt).toBeNull();
    expect(rehydrated.version).toBe(3);
  });
});
