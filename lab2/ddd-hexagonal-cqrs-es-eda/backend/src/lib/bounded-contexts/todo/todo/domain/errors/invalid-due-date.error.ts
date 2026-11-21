import { Domain } from 'ddd-tactical-core-boilerplate';

export class InvalidDueDateError extends Domain.Error {
  static readonly errorId = 'INVALID_DUE_DATE';

  constructor(dueDate: string) {
    super(
      `Due date ${dueDate} must be a valid calendar date in YYYY-MM-DD format`,
      InvalidDueDateError.errorId,
    );
  }
}
