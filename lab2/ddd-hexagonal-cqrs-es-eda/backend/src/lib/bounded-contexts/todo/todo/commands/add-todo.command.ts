import { Application } from 'ddd-tactical-core-boilerplate';

export type TAddTodoCommand = {
  title: string;
  dueDate?: string;
};

export class AddTodoCommand extends Application.Command {
  public title: string;
  public dueDate?: string;

  constructor(props: TAddTodoCommand) {
    super('Todo');
    this.title = props.title;
    this.dueDate = props.dueDate;
  }
}
