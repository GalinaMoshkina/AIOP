import { Application, Domain } from 'ddd-tactical-core-boilerplate';
import { TodoEntity } from '../domain/todo.entity.js';

export interface TodoWriteRepoPort
  extends Application.Repo.ICRUDWritePort<TodoEntity, Domain.UUIDv4> {
  getByIdIncludingDeleted(
    id: Domain.UUIDv4,
  ): Promise<Either<TodoEntity | null, Application.Repo.Errors.Unexpected>>;
}

// export interface ITodoWriteRepository {
//   findOneById(id: number): Promise<TodoEntity>;
//   findAll(): Promise<TodoEntity[]>;
//   save(hero: TodoEntity): Promise<void>;
// }
