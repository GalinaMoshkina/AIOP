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
  GetTodosResult,
  TodoReadRepoPort,
} from '@src/lib/bounded-contexts/todo/todo/ports/todo-read.repo-port';
import { TodoStatusFilter } from '@src/lib/bounded-contexts/todo/todo/queries/get-todos.query';

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
  async getAll(params?: {
    limit?: number;
    offset?: number;
    status?: TodoStatusFilter;
  }): Promise<Either<GetTodosResult, Application.Repo.Errors.Unexpected>> {
    const userId = this.authenticatedUserId();
    const limit = params?.limit ?? 20;
    const offset = params?.offset ?? 0;
    const status = params?.status ?? 'all';
    const statusFilter =
      status === 'all'
        ? ''
        : status === 'completed'
          ? 'AND completed = TRUE'
          : 'AND completed = FALSE';
    const result = await this.pool.query<TodoProjectionRow & { total: string }>(
      `SELECT
         id::text,
         user_id::text AS "userId",
         title,
         completed,
         COUNT(*) OVER() AS total
       FROM todo_projection
       WHERE user_id = $1
       ${statusFilter}
       ORDER BY updated_at DESC, id
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );

    if (result.rows.length > 0) {
      return ok({
        items: result.rows,
        total: Number(result.rows[0].total),
      });
    }

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total
       FROM todo_projection
       WHERE user_id = $1
       ${statusFilter}`,
      [userId],
    );

    return ok({
      items: [],
      total: Number(countResult.rows[0]?.total ?? 0),
    });
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
