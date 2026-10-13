import { Infra } from 'ddd-tactical-core-boilerplate';
import { TodoRestoredDomainEvent } from '../../domain/events/todo-restored.event';

type TodoRestoredIntegrationEventPayload = {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
};

export class TodoRestoredIntegrationEvent extends Infra.EventBus
  .IntegrationEvent<TodoRestoredIntegrationEventPayload> {
  public static readonly boundedContextId = 'Todo';
  public static readonly versions = ['v1'] as const;

  constructor(payload: TodoRestoredIntegrationEventPayload, version: string) {
    super('Todo', payload, version);
  }

  static create(event: TodoRestoredDomainEvent): TodoRestoredIntegrationEvent[] {
    return [
      new TodoRestoredIntegrationEvent(
        {
          id: event.payload.aggregateId,
          userId: event.payload.userId,
          title: event.payload.title,
          completed: event.payload.completed,
        },
        'v1',
      ),
    ];
  }
}
