import { Infra, Application, ok, Either } from 'ddd-tactical-core-boilerplate';
import { TodoDeletedDomainEvent } from '../../../domain/events/todo-deleted.event';
import { TodoDeletedIntegrationEvent } from '../../../contracts/integration-events/todo-deleted.integration-event';
import { Traceable } from '@lib/infra/telemetry';

export class TodoDeletedDomainToPubSubIntegrationEventHandler
  implements Application.IHandleDomainEvent
{
  constructor(private eventBus: Infra.EventBus.IEventBus) {}
  get event() {
    return TodoDeletedDomainEvent;
  }

  get boundedContext(): string {
    return 'Todo';
  }

  @Traceable({
    operation: '[Todo] TodoDeletedPubSubDomainEventHandler',
    serviceName: 'Todo',
    metrics: {
      name: '[Todo] TodoDeletedPubSubDomainEventHandler',
      category: 'domainEventHandler',
    },
  })
  public async handle(
    event: TodoDeletedDomainEvent,
  ): Promise<Either<void, never>> {
    const events = TodoDeletedIntegrationEvent.create(event);

    await this.eventBus.publish(events);

    console.log(
      `[TodoDeletedDomainEventHandler]: Successfully published TodoDeletedPubSubIntegrationEvent`,
    );
    return ok();
  }
}
