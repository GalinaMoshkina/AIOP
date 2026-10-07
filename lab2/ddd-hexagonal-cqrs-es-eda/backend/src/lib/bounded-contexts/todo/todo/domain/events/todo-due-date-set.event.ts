import { Domain } from 'ddd-tactical-core-boilerplate';

type TodoDueDateSetDomainEventProps = Domain.TDomainEventProps<{
  userId: string;
  title: string;
  completed: boolean;
  dueDate?: string | null;
}>;

export class TodoDueDateSetDomainEvent extends Domain.DomainEvent<TodoDueDateSetDomainEventProps> {
  public aggregateId: string;

  constructor(payload: TodoDueDateSetDomainEventProps) {
    super('Todo', payload);
    this.aggregateId = payload.aggregateId;
  }
}
