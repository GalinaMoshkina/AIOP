import { Infra, Application, ok, Either } from 'ddd-tactical-core-boilerplate';
import { TodoUncompletedDomainEvent } from '../../../domain/events/todo-uncompleted.event';
import { TodoUncompletedIntegrationEvent } from '../../../contracts/integration-events/todo-uncompleted.integration-event';
import { Traceable } from '@lib/infra/telemetry';

export class TodoUncompletedDomainToPubSubIntegrationEventHandler
  implements Application.IHandleDomainEvent
{
  constructor(private eventBus: Infra.EventBus.IEventBus) {}
  get event() {
    return TodoUncompletedDomainEvent;
  }

  get boundedContext(): string {
    return 'Todo';
  }

  @Traceable({
    operation: '[Todo] TodoUncompletedPubSubDomainEventHandler',
    serviceName: 'Todo',
    metrics: {
      name: '[Todo] TodoUncompletedPubSubDomainEventHandler',
      category: 'domainEventHandler',
    },
  })
  public async handle(
    event: TodoUncompletedDomainEvent,
  ): Promise<Either<void, never>> {
    const events = TodoUncompletedIntegrationEvent.create(event);

    await this.eventBus.publish(events);

    console.log(
      `[TodoUncompletedDomainEventHandler]: Successfully published TodoUncompletedPubSubIntegrationEvent`,
    );
    return ok();
  }
}
