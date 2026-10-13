import { Infra, Application, ok, Either } from 'ddd-tactical-core-boilerplate';
import { TodoRestoredDomainEvent } from '../../../domain/events/todo-restored.event';
import { TodoRestoredIntegrationEvent } from '../../../contracts/integration-events/todo-restored.integration-event';
import { Traceable } from '@lib/infra/telemetry';

export class TodoRestoredDomainToPubSubIntegrationEventHandler
  implements Application.IHandleDomainEvent
{
  constructor(private eventBus: Infra.EventBus.IEventBus) {}
  get event() {
    return TodoRestoredDomainEvent;
  }

  get boundedContext(): string {
    return 'Todo';
  }

  @Traceable({
    operation: '[Todo] TodoRestoredPubSubDomainEventHandler',
    serviceName: 'Todo',
    metrics: {
      name: '[Todo] TodoRestoredPubSubDomainEventHandler',
      category: 'domainEventHandler',
    },
  })
  public async handle(
    event: TodoRestoredDomainEvent,
  ): Promise<Either<void, never>> {
    await this.eventBus.publish(TodoRestoredIntegrationEvent.create(event));
    return ok();
  }
}
