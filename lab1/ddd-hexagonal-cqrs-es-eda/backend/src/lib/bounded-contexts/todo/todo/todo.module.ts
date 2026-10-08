import { Module, Provider } from '@nestjs/common';
import { Infra } from 'ddd-tactical-core-boilerplate';
import { PubSubCommandHandlers } from './application/command-handlers';
import { EventHandlers } from './application/event-handlers';
import { QueryHandlers } from './application/query-handlers';
import { GetTodosHandler } from './application/query-handlers/get-todos.handler';
import {
  PubSubIntegrationEventBusToken,
  StreamingIntegrationEventBusToken,
  TodoReadRepoPortToken,
  TodoWriteRepoPortToken,
} from './constants';
import { TodoReadRepoPort } from './ports/todo-read.repo-port';
import { TodoWriteRepoPort } from './ports/todo-write.repo-port';
import {
  TodoAddedDomainToIntegrationEventHandler,
  TodoCompletedDomainToIntegrationEventHandler,
} from './application/event-handlers/domain';

type TodoCommandHandlerType = new (
  todoWriteRepo: TodoWriteRepoPort,
) => unknown;

type TodoDomainEventHandlerType = new (
  eventBus: Infra.EventBus.IEventBus,
) => unknown;

const writeCommandHandlerProviders = PubSubCommandHandlers.map((handler) => ({
  provide: handler,
  useFactory: (todoWriteRepo: TodoWriteRepoPort) =>
    new (handler as TodoCommandHandlerType)(todoWriteRepo),
  inject: [TodoWriteRepoPortToken],
}));

const streamingDomainEventHandlerProviders = EventHandlers.map((handler) => {
  const eventBusToken =
    handler === TodoAddedDomainToIntegrationEventHandler ||
    handler === TodoCompletedDomainToIntegrationEventHandler
      ? StreamingIntegrationEventBusToken
      : PubSubIntegrationEventBusToken;

  return {
    provide: handler,
    useFactory: (eventBus: Infra.EventBus.IEventBus) =>
      new (handler as TodoDomainEventHandlerType)(eventBus),
    inject: [eventBusToken],
  };
});

@Module({})
export class TodoModule {
  static register(options: { inject: Provider<any>[]; imports: any[] }) {
    const InjectedProviders = options.inject || [];
    const QueryHandlerProviders = QueryHandlers.filter(
      (handler) => handler !== GetTodosHandler,
    );
    return {
      module: TodoModule,
      imports: [...options.imports],
      providers: [
        ...writeCommandHandlerProviders,
        ...streamingDomainEventHandlerProviders,
        ...QueryHandlerProviders,
        {
          provide: GetTodosHandler,
          useFactory: (todoReadRepo: TodoReadRepoPort) =>
            new GetTodosHandler(todoReadRepo),
          inject: [TodoReadRepoPortToken],
        },
        ...InjectedProviders,
      ],
      exports: [...PubSubCommandHandlers, ...EventHandlers, ...QueryHandlers],
    };
  }
}
