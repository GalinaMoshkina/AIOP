import {
  Application,
  Either,
  asyncLocalStorage,
  ok,
} from 'ddd-tactical-core-boilerplate';
import { Inject, Injectable } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';

import { constants } from '@lib/infra/postgres';
import {
  TodoReadModel,
} from '@src/lib/bounded-contexts/todo/todo/domain/todo.read-model';
import {
  TodoListReadResult,
  TodoReadRepoPort,
} from '@src/lib/bounded-contexts/todo/todo/ports/todo-read.repo-port';
import { TodoListStatus } from '@src/lib/bounded-contexts/todo/todo/queries/get-todos.query';

type TodoProjectionRow = QueryResultRow & {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  deletedAt: string | null;
};

type TodoProjectionCountRow = QueryResultRow & {
  total: string;
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
         completed,
         deleted_at AS "deletedAt"
       FROM todo_projection
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId],
    );
    const row = result.rows[0];
    return ok(row ? TodoReadModel.fromPrimitives(row) : null);
  }

  @Application.Repo.Decorators.ReturnUnexpectedError()
  async getAll(params?: {
    limit?: number;
    offset?: number;
    status?: TodoListStatus;
  }): Promise<Either<TodoListReadResult, Application.Repo.Errors.Unexpected>> {
    const userId = this.authenticatedUserId();
    const limit = this.normaliseInteger(params?.limit, 20, 1, 100);
    const offset = this.normaliseInteger(params?.offset, 0, 0, Number.MAX_SAFE_INTEGER);
    const status = params?.status ?? 'all';
    const completed =
      status === 'all' ? null : status === 'completed';
    const values = [userId, completed];
    const countResult = await this.pool.query<TodoProjectionCountRow>(
      `SELECT COUNT(*)::int AS total
       FROM todo_projection
       WHERE user_id = $1
         AND deleted_at IS NULL
         AND ($2::boolean IS NULL OR completed = $2)`,
      values,
    );
    const result = await this.pool.query<TodoProjectionRow>(
      `SELECT
         id::text,
         user_id::text AS "userId",
         title,
         completed,
         deleted_at AS "deletedAt"
       FROM todo_projection
       WHERE user_id = $1
         AND deleted_at IS NULL
         AND ($2::boolean IS NULL OR completed = $2)
       ORDER BY updated_at DESC, id
       LIMIT $3 OFFSET $4`,
      [...values, limit, offset],
    );

    return ok({
      items: result.rows,
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

  private normaliseInteger(
    value: number | undefined,
    fallback: number,
    minimum: number,
    maximum: number,
  ): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, parsed));
  }
}
