import { Domain, Either, fail, ok } from 'ddd-tactical-core-boilerplate';
import { DomainErrors } from './errors';

interface DueDateProps {
  value: string;
}

export class DueDateVO extends Domain.ValueObject<DueDateProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: DueDateProps) {
    super(props);
  }

  public static create(
    props: DueDateProps,
  ): Either<DueDateVO, DomainErrors.InvalidDueDateError> {
    if (!DueDateVO.isValidCalendarDate(props.value)) {
      return fail(new DomainErrors.InvalidDueDateError(props.value));
    }
    return ok(new DueDateVO(props));
  }

  private static isValidCalendarDate(value: string): boolean {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }
}
