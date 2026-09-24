import { Infra } from 'ddd-tactical-core-boilerplate';
import { TodoSoftDeletedDomainEvent } from '../../domain/events/todo-soft-deleted.event';

export type IntegrationSchemaV1 = {
  todoId: string;
  userId: string;
  deletedAt: string;
};

export class TodoSoftDeletedIntegrationEvent extends Infra.EventBus.IntegrationEvent<IntegrationSchemaV1> {
  static versions = ['v1'];
  public static readonly boundedContextId = 'Todo';

  constructor(payload: IntegrationSchemaV1, version: string) {
    super('Todo', payload, version);
  }

  static create(event: TodoSoftDeletedDomainEvent): TodoSoftDeletedIntegrationEvent[] {
    return TodoSoftDeletedIntegrationEvent.versions.map((version) => new TodoSoftDeletedIntegrationEvent(
      TodoSoftDeletedIntegrationEvent.toIntegrationDataV1(event), version,
    ));
  }

  static toIntegrationDataV1(event: TodoSoftDeletedDomainEvent): IntegrationSchemaV1 {
    return {
      todoId: event.payload.aggregateId,
      userId: event.payload.userId,
      deletedAt: event.payload.deletedAt,
    };
  }
}
