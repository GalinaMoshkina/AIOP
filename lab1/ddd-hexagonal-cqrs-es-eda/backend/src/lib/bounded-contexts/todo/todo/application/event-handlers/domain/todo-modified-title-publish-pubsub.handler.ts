import { Infra, Application, ok, Either } from 'ddd-tactical-core-boilerplate';
import { TodoModifiedTitleDomainEvent } from '../../../domain/events/todo-modified-title.event';
import { TodoModifiedTitleIntegrationEvent } from '../../../contracts/integration-events/todo-modified-title.integration-event';
import { Traceable } from '@lib/infra/telemetry';

export class TodoModifiedTitleDomainToPubSubIntegrationEventHandler
  implements Application.IHandleDomainEvent
{
  constructor(private eventBus: Infra.EventBus.IEventBus) {}
  get event() {
    return TodoModifiedTitleDomainEvent;
  }

  get boundedContext(): string {
    return 'Todo';
  }

  @Traceable({
    operation: '[Todo] TodoModifiedTitlePubSubDomainEventHandler',
    serviceName: 'Todo',
    metrics: {
      name: '[Todo] TodoModifiedTitlePubSubDomainEventHandler',
      category: 'domainEventHandler',
    },
  })
  public async handle(
    event: TodoModifiedTitleDomainEvent,
  ): Promise<Either<void, never>> {
    const events = TodoModifiedTitleIntegrationEvent.create(event);

    await this.eventBus.publish(events);

    console.log(
      `[TodoModifiedTitleDomainEventHandler]: Successfully published TodoModifiedTitlePubSubIntegrationEvent`,
    );
    return ok();
  }
}
