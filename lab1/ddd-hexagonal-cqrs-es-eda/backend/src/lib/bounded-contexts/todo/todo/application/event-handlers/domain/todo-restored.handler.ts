import { Infra, Application, Either, ok } from 'ddd-tactical-core-boilerplate';
import { Inject } from '@nestjs/common';
import { TodoRestoredDomainEvent } from '../../../domain/events/todo-restored.event';
import { TodoRestoredIntegrationEvent } from '../../../contracts/integration-events/todo-restored.integration-event';
import { StreamingIntegrationEventBusToken } from '../../../constants';

export class TodoRestoredDomainToIntegrationEventHandler implements Application.IHandleDomainEvent {
  constructor(@Inject(StreamingIntegrationEventBusToken) private eventBus: Infra.EventBus.IEventBus) {}
  get event() { return TodoRestoredDomainEvent; }
  get boundedContext(): string { return 'Todo'; }

  async handle(event: TodoRestoredDomainEvent): Promise<Either<void, never>> {
    await this.eventBus.publish(TodoRestoredIntegrationEvent.create(event));
    return ok();
  }
}
