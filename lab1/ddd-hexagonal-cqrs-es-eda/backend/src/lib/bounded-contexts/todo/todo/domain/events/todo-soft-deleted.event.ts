import { Domain } from 'ddd-tactical-core-boilerplate';

type TodoSoftDeletedDomainEventProps = Domain.TDomainEventProps<{
  userId: string;
  title: string;
  completed: boolean;
  deletedAt?: string | null;
}>;

export class TodoSoftDeletedDomainEvent extends Domain.DomainEvent<TodoSoftDeletedDomainEventProps> {
  public aggregateId: any;

  constructor(payload: TodoSoftDeletedDomainEventProps) {
    super('Todo', payload);
    this.aggregateId = payload.aggregateId;
  }
}
