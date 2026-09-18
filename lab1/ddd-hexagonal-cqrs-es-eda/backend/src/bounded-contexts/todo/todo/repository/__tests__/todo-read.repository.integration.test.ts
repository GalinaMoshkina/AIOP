import { asyncLocalStorage } from 'ddd-tactical-core-boilerplate';
import { Pool } from 'pg';

import { TODO_POSTGRES_SCHEMA } from '../todo-postgres.schema';
import { TodoReadRepository } from '../todo-read.repository';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('Todo PostgreSQL read repository', () => {
  const userId = '4f28e489-3b4f-48f7-a5f8-457246e229a5';
  const otherUserId = 'd6ad1c15-b92d-4f8d-afdc-835f5e3ddf5a';
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
    mockAuthenticatedUser(userId);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('filters before pagination and returns only the authenticated user tasks in a stable order', async () => {
    await seedTodo({
      id: '00000000-0000-4000-8000-000000000003',
      userId,
      title: 'third active',
      completed: false,
      createdAt: '2026-01-01T00:00:03Z',
    });
    await seedTodo({
      id: '00000000-0000-4000-8000-000000000001',
      userId,
      title: 'first completed',
      completed: true,
      createdAt: '2026-01-01T00:00:01Z',
    });
    await seedTodo({
      id: '00000000-0000-4000-8000-000000000002',
      userId,
      title: 'second completed',
      completed: true,
      createdAt: '2026-01-01T00:00:02Z',
    });
    await seedTodo({
      id: '00000000-0000-4000-8000-000000000004',
      userId: otherUserId,
      title: 'other user completed',
      completed: true,
      createdAt: '2026-01-01T00:00:00Z',
    });

    const result = await repository.getAll({
      page: 2,
      limit: 1,
      status: 'completed',
    });

    expect(result.isOk()).toBe(true);
    if (result.isFail()) throw result.value;
    expect(result.value).toEqual({
      items: [
        {
          id: '00000000-0000-4000-8000-000000000002',
          userId,
          title: 'second completed',
          completed: true,
        },
      ],
      total: 2,
      page: 2,
      limit: 1,
    });
  });

  it('uses id as a tie-breaker when creation time is equal', async () => {
    await seedTodo({
      id: '00000000-0000-4000-8000-000000000006',
      userId,
      title: 'second by id',
      completed: false,
      createdAt: '2026-01-01T00:00:00Z',
    });
    await seedTodo({
      id: '00000000-0000-4000-8000-000000000005',
      userId,
      title: 'first by id',
      completed: false,
      createdAt: '2026-01-01T00:00:00Z',
    });

    const result = await repository.getAll({
      page: 1,
      limit: 10,
      status: 'active',
    });

    expect(result.isOk()).toBe(true);
    if (result.isFail()) throw result.value;
    expect(result.value.items.map((todo) => todo.id)).toEqual([
      '00000000-0000-4000-8000-000000000005',
      '00000000-0000-4000-8000-000000000006',
    ]);
    expect(result.value.total).toBe(2);
  });

  function mockAuthenticatedUser(authenticatedUserId: string): void {
    jest.mocked(asyncLocalStorage.getStore).mockReturnValue({
      get: (key: string) =>
        key === 'context' ? { userId: authenticatedUserId } : undefined,
    } as ReturnType<typeof asyncLocalStorage.getStore>);
  }

  async function seedTodo(params: {
    id: string;
    userId: string;
    title: string;
    completed: boolean;
    createdAt: string;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO todo_projection (
         id,
         user_id,
         title,
         completed,
         version,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3, $4, 1, $5, $5)`,
      [
        params.id,
        params.userId,
        params.title,
        params.completed,
        params.createdAt,
      ],
    );
  }
});
