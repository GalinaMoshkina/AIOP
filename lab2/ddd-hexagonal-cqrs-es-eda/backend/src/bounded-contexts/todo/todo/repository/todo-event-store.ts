import { Domain } from 'ddd-tactical-core-boilerplate';

import { TodoAddedDomainEvent } from '@src/lib/bounded-contexts/todo/todo/domain/events/todo-added.event';
import { TodoCompletedDomainEvent } from '@src/lib/bounded-contexts/todo/todo/domain/events/todo-completed.event';
import { TodoDeletedDomainEvent } from '@src/lib/bounded-contexts/todo/todo/domain/events/todo-deleted.event';
import { TodoDueDateRemovedDomainEvent } from '@src/lib/bounded-contexts/todo/todo/domain/events/todo-due-date-removed.event';
import { TodoDueDateSetDomainEvent } from '@src/lib/bounded-contexts/todo/todo/domain/events/todo-due-date-set.event';
import { TodoModifiedTitleDomainEvent } from '@src/lib/bounded-contexts/todo/todo/domain/events/todo-modified-title.event';
import { TodoUncompletedDomainEvent } from '@src/lib/bounded-contexts/todo/todo/domain/events/todo-uncompleted.event';
import {
  TodoEventPayload,
  TodoEventType,
  TodoHistoryEvent,
} from '@src/lib/bounded-contexts/todo/todo/domain/todo.entity';

export type PersistableTodoEventType = TodoEventType;

export type StoredTodoEvent = TodoHistoryEvent & {
  eventId: string;
  aggregateId: string;
  metadata: Domain.TDomainEventMetadata;
};

export type TodoOutboxMessage = {
  id: string;
  aggregateId: string;
  eventType: PersistableTodoEventType;
  payload: TodoEventPayload;
  metadata: Domain.TDomainEventMetadata;
  attempts: number;
};

type TodoDomainEvent =
  | TodoAddedDomainEvent
  | TodoCompletedDomainEvent
  | TodoDeletedDomainEvent
  | TodoDueDateRemovedDomainEvent
  | TodoDueDateSetDomainEvent
  | TodoModifiedTitleDomainEvent
  | TodoUncompletedDomainEvent;

type TodoDomainEventConstructor = new (payload: TodoEventPayload) => TodoDomainEvent;

const eventConstructors: Record<PersistableTodoEventType, TodoDomainEventConstructor> = {
  TodoAddedDomainEvent,
  TodoCompletedDomainEvent,
  TodoDeletedDomainEvent,
  TodoDueDateRemovedDomainEvent,
  TodoDueDateSetDomainEvent,
  TodoModifiedTitleDomainEvent,
  TodoUncompletedDomainEvent,
};

export function serialiseTodoEvent(
  event: Domain.DomainEvent<TodoEventPayload>,
  version: number,
): StoredTodoEvent {
  const eventType = event.constructor.name as PersistableTodoEventType;
  if (!(eventType in eventConstructors)) {
    throw new Error(`Unsupported Todo domain event: ${event.constructor.name}`);
  }

  return {
    eventId: event.metadata.messageId,
    aggregateId: event.payload.aggregateId,
    eventType,
    payload: event.payload,
    metadata: event.metadata,
    version,
  };
}

export function rehydrateTodoDomainEvent(message: TodoOutboxMessage): TodoDomainEvent {
  const EventConstructor = eventConstructors[message.eventType];
  const event = new EventConstructor(message.payload);
  event.metadata = message.metadata;
  event.aggregateId = message.aggregateId;
  return event;
}
