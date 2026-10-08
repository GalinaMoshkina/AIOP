import { Infra, Application, ok, Either } from 'ddd-tactical-core-boilerplate';
import { TodoAddedDomainEvent } from '../../../domain/events/todo-added.event';
import { TodoAddedIntegrationEvent } from '../../../contracts/integration-events/todo-added.integration-event';
import { Traceable } from '@lib/infra/telemetry';

export class TodoAddedDomainToIntegrationEventHandler
  implements Application.IHandleDomainEvent
{
  constructor(private eventBus: Infra.EventBus.IEventBus) {}
  get event() {
    return TodoAddedDomainEvent;
  }

  get boundedContext(): string {
    return 'Todo';
  }

  @Traceable({
    operation: '[Todo] TodoAddedDomainEventHandler',
    serviceName: 'Todo',
    metrics: {
      name: '[Todo] TodoAddedDomainEventHandler',
      category: 'domainEventHandler',
    },
  })
  public async handle(
    event: TodoAddedDomainEvent,
  ): Promise<Either<void, never>> {
    const events = TodoAddedIntegrationEvent.create(event);

    // await this.eventBus.publish(events);

    console.log(
      `[TodoAddedDomainEventHandler]: Successfully published TodoAddedIntegrationEvent`,
    );
    return ok();
  }
}
