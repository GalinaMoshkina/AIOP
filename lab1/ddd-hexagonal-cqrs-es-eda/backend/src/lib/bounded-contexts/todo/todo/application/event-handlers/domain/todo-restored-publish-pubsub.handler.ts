import { Infra, Application, Either, ok } from 'ddd-tactical-core-boilerplate';
import { Inject } from '@nestjs/common';
import { TodoRestoredDomainEvent } from '../../../domain/events/todo-restored.event';
import { TodoRestoredIntegrationEvent } from '../../../contracts/integration-events/todo-restored.integration-event';
import { PubSubIntegrationEventBusToken } from '../../../constants';
import { Traceable } from '@lib/infra/telemetry';

export class TodoRestoredDomainToPubSubIntegrationEventHandler implements Application.IHandleDomainEvent {
  constructor(@Inject(PubSubIntegrationEventBusToken) private eventBus: Infra.EventBus.IEventBus) {}

  get event() { return TodoRestoredDomainEvent; }
  get boundedContext(): string { return 'Todo'; }

  @Traceable({
    operation: '[Todo] TodoRestoredDomainEventHandler',
    serviceName: 'Todo',
    metrics: { name: '[Todo] TodoRestoredDomainEventHandler', category: 'domainEventHandler' },
  })
  async handle(event: TodoRestoredDomainEvent): Promise<Either<void, never>> {
    await this.eventBus.publish(TodoRestoredIntegrationEvent.create(event));
    return ok();
  }
}
