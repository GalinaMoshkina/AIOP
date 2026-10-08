import { Module, Provider } from '@nestjs/common';
import { Infra } from 'ddd-tactical-core-boilerplate';
import {
  StreamingCommandHandlers,
} from './application/command-handlers';
import { EventHandlers } from './application/event-handlers';
// import { QueryHandlers } from './application/query-handlers';
import { ChangeUserEmailCommandHandler } from './application/command-handlers/change-user-email.command-handler';
import { CreateUserCommandHandler } from './application/command-handlers/create-user.command-handler';
import { IncrementTodosCommandHandler } from './application/command-handlers/increment-todos.command-handler';
import { SendEmailCommandHandler } from './application/command-handlers/send-email.command-handler';
import { TodoCompletionsIncrementedHandler } from './application/event-handlers/domain/todo-completions-incremented.handler';
import { TodoCompletedIntegrationEventHandler } from './application/event-handlers/integration/todo-completed.integration-handler';
import { UserEmailChangedIntegrationEventHandler } from './application/event-handlers/integration/user-email-changed.integration-handler';
import { UserRegisteredIntegrationEventHandler } from './application/event-handlers/integration/user-registered.integration-handler';
import {
  EmailServicePortToken,
  NotificationTemplateReadRepoPortToken,
  StreamingCommandBusToken,
  UserWriteRepoPortToken,
} from './constants';
import { EmailServicePort } from './ports/email.service-port';
import { NotificationTemplateReadRepoPort } from './ports/notification-template-read.repo-port';
import { UserWriteRepoPort } from './ports/user-write.repo-port';

const userWriteCommandHandlerProviders = [
  IncrementTodosCommandHandler,
  ChangeUserEmailCommandHandler,
  CreateUserCommandHandler,
].map((handler) => ({
  provide: handler,
  useFactory: (userWriteRepo: UserWriteRepoPort) => new handler(userWriteRepo),
  inject: [UserWriteRepoPortToken],
}));

const emailCommandHandlerProvider = {
  provide: SendEmailCommandHandler,
  useFactory: (emailService: EmailServicePort) =>
    new SendEmailCommandHandler(emailService),
  inject: [EmailServicePortToken],
};

const commandBusIntegrationEventHandlerProviders = [
  TodoCompletedIntegrationEventHandler,
  UserEmailChangedIntegrationEventHandler,
  UserRegisteredIntegrationEventHandler,
].map((handler) => ({
  provide: handler,
  useFactory: (commandBus: Infra.CommandBus.IStreamCommandBus) =>
    new handler(commandBus),
  inject: [StreamingCommandBusToken],
}));

const todoCompletionsIncrementedProvider = {
  provide: TodoCompletionsIncrementedHandler,
  useFactory: (
    commandBus: Infra.CommandBus.IStreamCommandBus,
    userWriteRepo: UserWriteRepoPort,
    notificationTemplateRepo: NotificationTemplateReadRepoPort,
  ) =>
    new TodoCompletionsIncrementedHandler(
      commandBus,
      userWriteRepo,
      notificationTemplateRepo,
    ),
  inject: [
    StreamingCommandBusToken,
    UserWriteRepoPortToken,
    NotificationTemplateReadRepoPortToken,
  ],
};

@Module({})
export class MarketingModule {
  static register(options: { inject: Provider<any>[]; imports: any[] }) {
    const InjectedProviders = options.inject || [];
    return {
      module: MarketingModule,
      imports: [...options.imports],
      providers: [
        ...userWriteCommandHandlerProviders,
        emailCommandHandlerProvider,
        ...commandBusIntegrationEventHandlerProviders,
        todoCompletionsIncrementedProvider,
        // ...QueryHandlers,
        ...InjectedProviders,
      ],
      exports: [
        ...StreamingCommandHandlers,
        ...EventHandlers /*...QueryHandlers*/,
      ],
    };
  }
}
