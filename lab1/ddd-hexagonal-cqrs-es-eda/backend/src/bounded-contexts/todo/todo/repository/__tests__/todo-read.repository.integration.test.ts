import { asyncLocalStorage } from 'ddd-tactical-core-boilerplate';
import { Pool } from 'pg';

import { TODO_POSTGRES_SCHEMA } from '../todo-postgres.schema';
import { TodoReadRepository } from '../todo-read.repository';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('Todo PostgreSQL read repository', () => {
  const userId = '4f28e489-3b4f-48f7-a5f8-457246e229a5';
  const otherUserId = '2f03974f-20e6-4c3e-baa1-eec6e388caa6';
  const pool = new Pool({
    host: process.env.PG_HOST ?? 'localhost',
    port: Number(process.env.PG_PORT ?? 5432),
    database: process.env.PG_DATABASE ?? 'bitloops_test',
    user: process.env.PG_USER ?? 'user',
    password: process.env.PG_PASSWORD ?? 'postgres',
  });
  const repository = new TodoReadRepository(pool);

  beforeAll(async () => {
    await pool.query(TODO_POSTGRES_SCHEMA);
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE todo_outbox, todo_projection, todo_events');
    jest.mocked(asyncLocalStorage.getStore).mockReturnValue({
      get: (key: string) => {
        if (key === 'context') return { userId };
        return undefined;
      },
    } as ReturnType<typeof asyncLocalStorage.getStore>);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('filters by owner and completion status before paginating', async () => {
    await insertProjection({
      id: '10000000-0000-4000-8000-000000000001',
      userId,
      title: 'Newest active todo',
      completed: false,
      version: 1,
      updatedAt: '2026-01-03T00:00:00.000Z',
    });
    await insertProjection({
      id: '10000000-0000-4000-8000-000000000002',
      userId,
      title: 'Completed todo',
      completed: true,
      version: 1,
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
    await insertProjection({
      id: '10000000-0000-4000-8000-000000000003',
      userId,
      title: 'Oldest active todo',
      completed: false,
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await insertProjection({
      id: '10000000-0000-4000-8000-000000000004',
      userId: otherUserId,
      title: 'Other user todo',
      completed: false,
      version: 1,
      updatedAt: '2026-01-04T00:00:00.000Z',
    });

    const result = await repository.getAll({
      limit: 1,
      offset: 1,
      status: 'active',
    });

    expect(result.isOk()).toBe(true);
    if (result.isFail()) throw result.value;
    expect(result.value.total).toBe(2);
    expect(result.value.items).toEqual([
      {
        id: '10000000-0000-4000-8000-000000000003',
        userId,
        title: 'Oldest active todo',
        completed: false,
      },
    ]);
  });

  async function insertProjection(params: {
    id: string;
    userId: string;
    title: string;
    completed: boolean;
    version: number;
    updatedAt: string;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO todo_projection (id, user_id, title, completed, version, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.id,
        params.userId,
        params.title,
        params.completed,
        params.version,
        params.updatedAt,
      ],
    );
  }
});
