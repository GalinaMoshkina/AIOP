import { Application } from 'ddd-tactical-core-boilerplate';

export class RestoreTodoCommand extends Application.Command {
  public id: string;

  constructor(props: { id: string }) {
    super('Todo');
    this.id = props.id;
  }
}
