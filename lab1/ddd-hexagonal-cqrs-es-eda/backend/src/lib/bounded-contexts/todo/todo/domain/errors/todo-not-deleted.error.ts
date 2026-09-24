import { Domain } from 'ddd-tactical-core-boilerplate';

export class TodoNotDeletedError extends Domain.Error {
  static readonly errorId = '';

  constructor(id: string) {
    super(`Todo ${id} is not deleted`, TodoNotDeletedError.errorId);
  }
}
