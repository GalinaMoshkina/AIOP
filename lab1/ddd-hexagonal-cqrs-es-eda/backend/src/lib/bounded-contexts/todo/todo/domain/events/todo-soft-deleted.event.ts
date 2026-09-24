import { Domain } from 'ddd-tactical-core-boilerplate';

type TodoSoftDeletedDomainEventProps = Domain.TDomainEventProps<{
  userId: string;
  title: string;
  completed: boolean;
  deletedAt: string;
}>;

export class TodoSoftDeletedDomainEvent extends Domain.DomainEvent<TodoSoftDeletedDomainEventProps> {
  public aggregateId: string;

  constructor(payload: TodoSoftDeletedDomainEventProps) {
    super('Todo', payload);
    this.aggregateId = payload.aggregateId;
  }
}
