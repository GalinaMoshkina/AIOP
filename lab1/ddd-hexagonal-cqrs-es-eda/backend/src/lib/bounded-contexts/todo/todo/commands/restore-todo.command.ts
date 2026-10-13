import { Application } from 'ddd-tactical-core-boilerplate';

export type TRestoreTodoCommand = {
  id: string;
};

export class RestoreTodoCommand extends Application.Command {
  public id: string;

  constructor(props: TRestoreTodoCommand) {
    super('Todo');
    this.id = props.id;
  }
}
