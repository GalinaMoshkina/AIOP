import { Domain } from 'ddd-tactical-core-boilerplate';

export class TodoAlreadyDeletedError extends Domain.Error {
  static readonly errorId = '';

  constructor(id: string) {
    super(`Todo ${id} already deleted`, TodoAlreadyDeletedError.errorId);
  }
}
