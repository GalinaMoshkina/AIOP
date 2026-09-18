import {
  Application,
  Either,
  asyncLocalStorage,
  ok,
} from 'ddd-tactical-core-boilerplate';
import { Inject, Injectable } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';

import { constants } from '@lib/infra/postgres';
import { TodoReadModel } from '@src/lib/bounded-contexts/todo/todo/domain/todo.read-model';
import {
  TodoPage,
  TodoReadRepoPort,
} from '@src/lib/bounded-contexts/todo/todo/ports/todo-read.repo-port';

type TodoProjectionRow = QueryResultRow & {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
};

@Injectable()
export class TodoReadRepository implements TodoReadRepoPort {
  constructor(@Inject(constants.pg_connection) private readonly pool: Pool) {}

  @Application.Repo.Decorators.ReturnUnexpectedError()
  async getById(
    id: string,
  ): Promise<Either<TodoReadModel | null, Application.Repo.Errors.Unexpected>> {
    const userId = this.authenticatedUserId();
    const result = await this.pool.query<TodoProjectionRow>(
      `SELECT
         id::text,
         user_id::text AS "userId",
         title,
         completed
       FROM todo_projection
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    const row = result.rows[0];
    return ok(row ? TodoReadModel.fromPrimitives(row) : null);
  }

  @Application.Repo.Decorators.ReturnUnexpectedError()
  async getAll(
    params: Parameters<TodoReadRepoPort['getAll']>[0],
  ): Promise<Either<TodoPage, Application.Repo.Errors.Unexpected>> {
    const userId = this.authenticatedUserId();
    const { page, limit, status } = params;
    const completed = status === 'all' ? null : status === 'completed';
    const offset = (BigInt(page) - 1n) * BigInt(limit);
    const result = await this.pool.query<{ items: TodoPage['items']; total: number }>(
      `WITH filtered AS (
         SELECT id, user_id, title, completed, created_at
         FROM todo_projection
         WHERE user_id = $1 AND ($2::boolean IS NULL OR completed = $2)
       ), paged AS (
         SELECT * FROM filtered ORDER BY created_at, id LIMIT $3 OFFSET $4
       )
       SELECT
         COALESCE((
           SELECT jsonb_agg(
             jsonb_build_object(
               'id', id::text,
               'userId', user_id::text,
               'title', title,
               'completed', completed
             )
             ORDER BY created_at, id
           )
           FROM paged
         ), '[]'::jsonb) AS items,
         (SELECT COUNT(*)::int FROM filtered) AS total`,
      [userId, completed, limit, offset.toString()],
    );
    return ok({ ...result.rows[0], page, limit });
  }

  private authenticatedUserId(): string {
    const context = asyncLocalStorage.getStore()?.get('context') as
      | { userId?: unknown }
      | undefined;
    if (typeof context?.userId !== 'string') {
      throw new Error('Missing authenticated request context');
    }
    return context.userId;
  }
}
