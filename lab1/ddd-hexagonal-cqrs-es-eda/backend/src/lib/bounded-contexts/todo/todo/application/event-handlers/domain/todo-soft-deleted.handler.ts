import { Infra, Application, Either, ok } from 'ddd-tactical-core-boilerplate';
import { Inject } from '@nestjs/common';
import { TodoSoftDeletedDomainEvent } from '../../../domain/events/todo-soft-deleted.event';
import { TodoSoftDeletedIntegrationEvent } from '../../../contracts/integration-events/todo-soft-deleted.integration-event';
import { StreamingIntegrationEventBusToken } from '../../../constants';

export class TodoSoftDeletedDomainToIntegrationEventHandler implements Application.IHandleDomainEvent {
  constructor(@Inject(StreamingIntegrationEventBusToken) private eventBus: Infra.EventBus.IEventBus) {}
  get event() { return TodoSoftDeletedDomainEvent; }
  get boundedContext(): string { return 'Todo'; }

  async handle(event: TodoSoftDeletedDomainEvent): Promise<Either<void, never>> {
    await this.eventBus.publish(TodoSoftDeletedIntegrationEvent.create(event));
    return ok();
  }
}
