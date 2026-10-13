import { Infra } from 'ddd-tactical-core-boilerplate';
import { TodoSoftDeletedDomainEvent } from '../../domain/events/todo-soft-deleted.event';

type TodoSoftDeletedIntegrationEventPayload = {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  deletedAt: string;
};

export class TodoSoftDeletedIntegrationEvent extends Infra.EventBus
  .IntegrationEvent<TodoSoftDeletedIntegrationEventPayload> {
  public static readonly boundedContextId = 'Todo';
  public static readonly versions = ['v1'] as const;

  constructor(payload: TodoSoftDeletedIntegrationEventPayload, version: string) {
    super('Todo', payload, version);
  }

  static create(event: TodoSoftDeletedDomainEvent): TodoSoftDeletedIntegrationEvent[] {
    return [
      new TodoSoftDeletedIntegrationEvent(
        {
          id: event.payload.aggregateId,
          userId: event.payload.userId,
          title: event.payload.title,
          completed: event.payload.completed,
          deletedAt: event.payload.deletedAt ?? new Date().toISOString(),
        },
        'v1',
      ),
    ];
  }
}
