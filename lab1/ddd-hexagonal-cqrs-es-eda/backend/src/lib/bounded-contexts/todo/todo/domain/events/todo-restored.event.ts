import { Domain } from 'ddd-tactical-core-boilerplate';

type TodoRestoredDomainEventProps = Domain.TDomainEventProps<{
  userId: string;
  title: string;
  completed: boolean;
  deletedAt: null;
}>;

export class TodoRestoredDomainEvent extends Domain.DomainEvent<TodoRestoredDomainEventProps> {
  public aggregateId: string;

  constructor(payload: TodoRestoredDomainEventProps) {
    super('Todo', payload);
    this.aggregateId = payload.aggregateId;
  }
}
