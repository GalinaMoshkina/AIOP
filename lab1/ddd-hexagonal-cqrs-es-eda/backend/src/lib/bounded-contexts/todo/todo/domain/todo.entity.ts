import { Domain, Either, ok, fail } from 'ddd-tactical-core-boilerplate';
import { TitleVO } from './title.value-object';
import { UserIdVO } from './user-id.value-object';
import { DomainErrors } from './errors';
import { TodoAddedDomainEvent } from './events/todo-added.event';
import { TodoModifiedTitleDomainEvent } from './events/todo-modified-title.event';
import { TodoCompletedDomainEvent } from './events/todo-completed.event';
import { TodoUncompletedDomainEvent } from './events/todo-uncompleted.event';
import { Rules } from './rules';
import { TodoDeletedDomainEvent } from './events/todo-deleted.event';
import { TodoSoftDeletedDomainEvent } from './events/todo-soft-deleted.event';
import { TodoRestoredDomainEvent } from './events/todo-restored.event';

export interface TodoProps {
  userId: UserIdVO;
  id?: Domain.UUIDv4;
  title: TitleVO;
  completed: boolean;
  deletedAt?: Date | null;
}

export type TodoEventType =
  | 'TodoAddedDomainEvent'
  | 'TodoModifiedTitleDomainEvent'
  | 'TodoCompletedDomainEvent'
  | 'TodoUncompletedDomainEvent'
  | 'TodoDeletedDomainEvent'
  | 'TodoSoftDeletedDomainEvent'
  | 'TodoRestoredDomainEvent';

export type TodoEventPayload = {
  aggregateId: string;
  userId: string;
  title: string;
  completed: boolean;
  deletedAt?: string | null;
};

export type TodoHistoryEvent = {
  eventType: TodoEventType;
  payload: TodoEventPayload;
  version: number;
};

type TTodoEntityPrimitives = {
  id: string;
  userId: { id: string };
  title: { title: string };
  completed: boolean;
  deletedAt?: string | null;
};

export class TodoEntity extends Domain.Aggregate<TodoProps, Domain.UUIDv4> {
  private eventStreamVersion = 0;

  private constructor(props: TodoProps, id: Domain.UUIDv4) {
    super(props, id);
  }

  public static create(props: TodoProps): Either<TodoEntity, never> {
    const isNew = !props.id;
    const id = props.id ?? Domain.UUIDv4.generate();
    const todo = new TodoEntity({ ...props, deletedAt: props.deletedAt ?? null, id }, id);

    if (isNew) {
      todo.addDomainEvent(new TodoAddedDomainEvent({
        title: todo.title.title,
        userId: todo.userId.id.toString(),
        completed: todo.completed,
        aggregateId: todo.id.toString(),
      }));
    }
    return ok(todo);
  }

  get completed(): boolean {
    return this.props.completed;
  }

  get title(): TitleVO {
    return this.props.title;
  }

  get userId(): UserIdVO {
    return this.props.userId;
  }

  get version(): number {
    return this.eventStreamVersion;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  public complete(): Either<void, DomainErrors.TodoAlreadyCompletedError> {
    const res = Domain.applyRules([
      new Rules.TodoAlreadyCompleted(this.props.completed, this.id.toString()),
    ]);
    if (res) return fail(res);
    this.props.completed = true;
    this.addDomainEvent(new TodoCompletedDomainEvent({
      title: this.title.title,
      userId: this.userId.id.toString(),
      completed: this.completed,
      aggregateId: this.id.toString(),
    }));
    return ok();
  }

  public uncomplete(): Either<void, DomainErrors.TodoAlreadyUncompletedError> {
    const res = Domain.applyRules([
      new Rules.TodoAlreadyUncompleted(this.props.completed, this.id.toString()),
    ]);
    if (res) return fail(res);
    this.props.completed = false;
    this.addDomainEvent(new TodoUncompletedDomainEvent({
      title: this.title.title,
      userId: this.userId.id.toString(),
      completed: this.completed,
      aggregateId: this.id.toString(),
    }));
    return ok();
  }

  public markAsDeleted(): Either<void, DomainErrors.TodoAlreadyDeletedError> {
    if (this.isDeleted) return fail(new DomainErrors.TodoAlreadyDeletedError(this.id.toString()));

    const deletedAt = new Date();
    this.props.deletedAt = deletedAt;
    this.addDomainEvent(new TodoSoftDeletedDomainEvent({
      title: this.title.title,
      userId: this.userId.id.toString(),
      completed: this.completed,
      deletedAt: deletedAt.toISOString(),
      aggregateId: this.id.toString(),
    }));
    return ok();
  }

  public restore(): Either<void, DomainErrors.TodoNotDeletedError> {
    if (!this.isDeleted) return fail(new DomainErrors.TodoNotDeletedError(this.id.toString()));

    this.props.deletedAt = null;
    this.addDomainEvent(new TodoRestoredDomainEvent({
      title: this.title.title,
      userId: this.userId.id.toString(),
      completed: this.completed,
      deletedAt: null,
      aggregateId: this.id.toString(),
    }));
    return ok();
  }

  /** @deprecated Use markAsDeleted(). Kept only to replay legacy histories. */
  public delete(): Either<void, void> {
    return this.markAsDeleted();
  }

  public modifyTitle(title: TitleVO): Either<void, never> {
    this.props.title = title;
    this.addDomainEvent(new TodoModifiedTitleDomainEvent({
      title: this.title.title,
      userId: this.userId.id.toString(),
      completed: this.completed,
      aggregateId: this.id.toString(),
    }));
    return ok();
  }

  public static fromPrimitives(data: TTodoEntityPrimitives): TodoEntity {
    const id = Domain.UUIDv4.fromString(data.id);
    const userId = UserIdVO.create({ id: Domain.UUIDv4.fromString(data.userId.id) }).value as UserIdVO;
    const title = TitleVO.create({ title: data.title.title }).value as TitleVO;
    return new TodoEntity({
      id,
      userId,
      title,
      completed: data.completed,
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
    }, id);
  }

  public static fromHistory(history: readonly TodoHistoryEvent[]): TodoEntity {
    if (history.length === 0) throw new Error('Cannot rehydrate a Todo aggregate from an empty history');

    let todo: TodoEntity | undefined;

    for (const event of history) {
      const { payload } = event;
      switch (event.eventType) {
        case 'TodoAddedDomainEvent':
          if (todo) throw new Error(`Todo ${payload.aggregateId} has more than one creation event`);
          todo = TodoEntity.fromPrimitives({
            id: payload.aggregateId,
            userId: { id: payload.userId },
            title: { title: payload.title },
            completed: payload.completed,
            deletedAt: null,
          });
          break;
        case 'TodoModifiedTitleDomainEvent': {
          const title = TitleVO.create({ title: payload.title });
          if (!todo || title.isFail()) throw new Error(`Invalid title history for Todo ${payload.aggregateId}`);
          todo.props.title = title.value;
          break;
        }
        case 'TodoCompletedDomainEvent':
          if (!todo) throw new Error(`Todo ${payload.aggregateId} is missing its creation event`);
          todo.props.completed = true;
          break;
        case 'TodoUncompletedDomainEvent':
          if (!todo) throw new Error(`Todo ${payload.aggregateId} is missing its creation event`);
          todo.props.completed = false;
          break;
        case 'TodoDeletedDomainEvent':
          if (!todo) throw new Error(`Todo ${payload.aggregateId} is missing its creation event`);
          todo.props.deletedAt = new Date();
          break;
        case 'TodoSoftDeletedDomainEvent':
          if (!todo) throw new Error(`Todo ${payload.aggregateId} is missing its creation event`);
          todo.props.deletedAt = payload.deletedAt ? new Date(payload.deletedAt) : new Date();
          break;
        case 'TodoRestoredDomainEvent':
          if (!todo) throw new Error(`Todo ${payload.aggregateId} is missing its creation event`);
          todo.props.deletedAt = null;
          break;
      }
      if (todo) todo.eventStreamVersion = event.version;
    }

    if (!todo) throw new Error('Todo history does not contain a creation event');
    todo.clearDomainEvents();
    return todo;
  }

  public commit(version: number): void {
    this.eventStreamVersion = version;
    this.clearDomainEvents();
  }

  public toPrimitives(): TTodoEntityPrimitives {
    return {
      id: this.id.toString(),
      userId: { id: this.props.userId.id.toString() },
      title: { title: this.props.title.title },
      completed: this.props.completed,
      deletedAt: this.props.deletedAt?.toISOString() ?? null,
    };
  }
}
