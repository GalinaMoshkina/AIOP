import { asyncLocalStorage } from 'ddd-tactical-core-boilerplate';
import { Pool } from 'pg';
import { TodoReadRepository } from '../todo-read.repository';
import { TODO_POSTGRES_SCHEMA } from '../todo-postgres.schema';

const describeDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;
describeDatabase('Todo list PostgreSQL query', () => {
  const pool = new Pool({
    host: process.env.PG_HOST ?? 'localhost',
    port: Number(process.env.PG_PORT ?? 5432),
    database: process.env.PG_DATABASE ?? 'bitloops_test',
    user: process.env.PG_USER ?? 'user',
    password: process.env.PG_PASSWORD ?? 'postgres',
  });
  const userId = '10000000-0000-4000-8000-000000000001';
  const otherUserId = '10000000-0000-4000-8000-000000000002';
  const repository = new TodoReadRepository(pool);
  beforeAll(async () => {
    await pool.query(TODO_POSTGRES_SCHEMA);
    await pool.query(
      'DELETE FROM todo_projection WHERE user_id = ANY($1::uuid[])',
      [[userId, otherUserId]],
    );
    for (let n = 1; n <= 6; n++) {
      await pool.query(
        `INSERT INTO todo_projection (id, user_id, title, completed, version, created_at)
        VALUES ($1, $2, $3, $4, 1, '2026-01-01')`,
        [
          `20000000-0000-4000-8000-00000000000${n}`,
          n === 6 ? otherUserId : userId,
          `Task ${n}`,
          n % 2 === 0,
        ],
      );
    }
  });
  beforeEach(() => {
    jest
      .mocked(asyncLocalStorage.getStore)
      .mockReturnValue(new Map([['context', { userId }]]));
  });
  afterAll(async () => {
    await pool.query(
      'DELETE FROM todo_projection WHERE user_id = ANY($1::uuid[])',
      [[userId, otherUserId]],
    );
    await pool.end();
  });
  it.each([
    ['all', 1, 5, ['Task 1', 'Task 2']],
    ['all', 2, 5, ['Task 3', 'Task 4']],
    ['completed', 1, 2, ['Task 2', 'Task 4']],
    ['active', 2, 3, ['Task 5']],
    ['completed', 9, 2, []],
  ] as const)(
    'filters %s page %s before pagination and isolates the user',
    async (status, page, total, titles) => {
      const result = await repository.getAll({ page, limit: 2, status });
      if (result.isFail()) throw result.value;
      expect(result.value).toMatchObject({ page, limit: 2, total });
      expect(result.value.items.map((item) => item.title)).toEqual(titles);
      expect(result.value.items.every((item) => item.userId === userId)).toBe(
        true,
      );
    },
  );
  it('returns no tasks for a user without tasks', async () => {
    jest
      .mocked(asyncLocalStorage.getStore)
      .mockReturnValue(
        new Map([
          ['context', { userId: '10000000-0000-4000-8000-000000000003' }],
        ]),
      );
    const result = await repository.getAll({
      page: 1,
      limit: 20,
      status: 'all',
    });
    expect(result.value).toEqual({ items: [], total: 0, page: 1, limit: 20 });
  });
  it('fails closed without authenticated context', async () => {
    jest.mocked(asyncLocalStorage.getStore).mockReturnValue(undefined);
    expect(
      (await repository.getAll({ page: 1, limit: 20, status: 'all' })).isFail(),
    ).toBe(true);
  });
});
