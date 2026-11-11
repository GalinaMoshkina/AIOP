export type TTodoReadModelSnapshot = {
  userId: string;
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string | null;
};

export class TodoReadModel {
  public id: string;
  public userId: string;
  public title: string;
  public completed: boolean;
  public dueDate?: string | null;

  constructor(public props: TTodoReadModelSnapshot) {
    this.id = props.id;
    this.userId = props.userId;
    this.title = props.title;
    this.completed = props.completed;
    this.dueDate = props.dueDate ?? null;
  }

  static fromPrimitives(snapshot: TTodoReadModelSnapshot): TodoReadModel {
    return new TodoReadModel(snapshot);
  }
}
