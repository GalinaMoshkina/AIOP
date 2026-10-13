import { Infra, Application, ok, Either } from 'ddd-tactical-core-boilerplate';
import { TodoSoftDeletedDomainEvent } from '../../../domain/events/todo-soft-deleted.event';
import { TodoSoftDeletedIntegrationEvent } from '../../../contracts/integration-events/todo-soft-deleted.integration-event';
import { Traceable } from '@lib/infra/telemetry';

export class TodoSoftDeletedDomainToPubSubIntegrationEventHandler
  implements Application.IHandleDomainEvent
{
  constructor(private eventBus: Infra.EventBus.IEventBus) {}
  get event() {
    return TodoSoftDeletedDomainEvent;
  }

  get boundedContext(): string {
    return 'Todo';
  }

  @Traceable({
    operation: '[Todo] TodoSoftDeletedPubSubDomainEventHandler',
    serviceName: 'Todo',
    metrics: {
      name: '[Todo] TodoSoftDeletedPubSubDomainEventHandler',
      category: 'domainEventHandler',
    },
  })
  public async handle(
    event: TodoSoftDeletedDomainEvent,
  ): Promise<Either<void, never>> {
    await this.eventBus.publish(TodoSoftDeletedIntegrationEvent.create(event));
    return ok();
  }
}
