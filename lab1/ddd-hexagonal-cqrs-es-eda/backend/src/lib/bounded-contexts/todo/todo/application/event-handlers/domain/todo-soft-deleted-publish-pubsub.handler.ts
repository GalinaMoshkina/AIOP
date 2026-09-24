import { Infra, Application, Either, ok } from 'ddd-tactical-core-boilerplate';
import { Inject } from '@nestjs/common';
import { TodoSoftDeletedDomainEvent } from '../../../domain/events/todo-soft-deleted.event';
import { TodoSoftDeletedIntegrationEvent } from '../../../contracts/integration-events/todo-soft-deleted.integration-event';
import { PubSubIntegrationEventBusToken } from '../../../constants';
import { Traceable } from '@lib/infra/telemetry';

export class TodoSoftDeletedDomainToPubSubIntegrationEventHandler implements Application.IHandleDomainEvent {
  constructor(@Inject(PubSubIntegrationEventBusToken) private eventBus: Infra.EventBus.IEventBus) {}

  get event() { return TodoSoftDeletedDomainEvent; }
  get boundedContext(): string { return 'Todo'; }

  @Traceable({
    operation: '[Todo] TodoSoftDeletedDomainEventHandler',
    serviceName: 'Todo',
    metrics: { name: '[Todo] TodoSoftDeletedDomainEventHandler', category: 'domainEventHandler' },
  })
  async handle(event: TodoSoftDeletedDomainEvent): Promise<Either<void, never>> {
    await this.eventBus.publish(TodoSoftDeletedIntegrationEvent.create(event));
    return ok();
  }
}
