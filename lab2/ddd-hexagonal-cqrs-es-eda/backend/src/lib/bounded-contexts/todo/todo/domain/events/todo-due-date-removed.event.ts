import { Domain } from 'ddd-tactical-core-boilerplate';

type TodoDueDateRemovedDomainEventProps = Domain.TDomainEventProps<{
  userId: string;
  title: string;
  completed: boolean;
}>;

export class TodoDueDateRemovedDomainEvent extends Domain.DomainEvent<TodoDueDateRemovedDomainEventProps> {
  public aggregateId: string;

  constructor(payload: TodoDueDateRemovedDomainEventProps) {
    super('Todo', payload);
    this.aggregateId = payload.aggregateId;
  }
}
