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
  TodoReadRepoPort,
  TodoPage,
  TodoPageOptions,
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
    params: TodoPageOptions,
  ): Promise<Either<TodoPage, Application.Repo.Errors.Unexpected>> {
    const userId = this.authenticatedUserId();
    const { page, limit, status } = params;
    // Count and page share one database snapshot, including for an empty page.
    const result = await this.pool.query<{
      items: TodoPage['items'];
      total: number;
    }>(
      `WITH filtered AS (
         SELECT id, user_id, title, completed, created_at
         FROM todo_projection
         WHERE user_id = $1 AND ($2::boolean IS NULL OR completed = $2)
       ), page_items AS (
         SELECT id::text, user_id::text AS "userId", title, completed, created_at
         FROM filtered ORDER BY created_at DESC, id ASC LIMIT $3 OFFSET $4
       )
       SELECT (SELECT count(*)::integer FROM filtered) AS total,
         COALESCE((SELECT jsonb_agg(
           jsonb_build_object('id', id, 'userId', "userId", 'title', title, 'completed', completed)
           ORDER BY created_at DESC, id ASC
         ) FROM page_items), '[]'::jsonb) AS items`,
      [
        userId,
        status === 'all' ? null : status === 'completed',
        limit,
        ((BigInt(page) - BigInt(1)) * BigInt(limit)).toString(),
      ],
    );
    return ok({ ...result.rows[0], page, limit });
  }

  private authenticatedUserId(): string {
    const context = asyncLocalStorage.getStore()?.get('context') as
      { userId?: unknown } | undefined;
    if (typeof context?.userId !== 'string') {
      throw new Error('Missing authenticated request context');
    }
    return context.userId;
  }
}
