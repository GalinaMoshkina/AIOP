import { Infra } from 'ddd-tactical-core-boilerplate';
import { TodoRestoredDomainEvent } from '../../domain/events/todo-restored.event';

export type IntegrationSchemaV1 = {
  todoId: string;
  userId: string;
  deletedAt: null;
};

export class TodoRestoredIntegrationEvent extends Infra.EventBus.IntegrationEvent<IntegrationSchemaV1> {
  static versions = ['v1'];
  public static readonly boundedContextId = 'Todo';

  constructor(payload: IntegrationSchemaV1, version: string) {
    super('Todo', payload, version);
  }

  static create(event: TodoRestoredDomainEvent): TodoRestoredIntegrationEvent[] {
    return TodoRestoredIntegrationEvent.versions.map((version) => new TodoRestoredIntegrationEvent(
      TodoRestoredIntegrationEvent.toIntegrationDataV1(event), version,
    ));
  }

  static toIntegrationDataV1(event: TodoRestoredDomainEvent): IntegrationSchemaV1 {
    return {
      todoId: event.payload.aggregateId,
      userId: event.payload.userId,
      deletedAt: event.payload.deletedAt,
    };
  }
}
