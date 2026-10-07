import { Application } from 'ddd-tactical-core-boilerplate';

export type TModifyTodoDueDateCommand = {
  id: string;
  dueDate?: string | null;
};

export class ModifyTodoDueDateCommand extends Application.Command {
  public id: string;
  public dueDate?: string | null;

  constructor(props: TModifyTodoDueDateCommand) {
    super('Todo');
    this.id = props.id;
    this.dueDate = props.dueDate;
  }
}
