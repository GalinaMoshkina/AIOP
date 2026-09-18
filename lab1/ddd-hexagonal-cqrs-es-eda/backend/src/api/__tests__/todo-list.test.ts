import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TodoController } from '../todo.rest.controller';
import { OidcAuthGuard } from '../../bounded-contexts/iam/iam/oidc/oidc-auth.guard';
import { BUSES_TOKENS } from '../../lib/infra/nest-jetstream';

describe('GET /todos', () => {
  let app: NestFastifyApplication;
  const request = jest.fn();
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [
        { provide: BUSES_TOKENS.PUBSUB_COMMAND_BUS, useValue: {} },
        { provide: BUSES_TOKENS.PUBSUB_QUERY_BYS, useValue: { request } },
      ],
    })
      .overrideGuard(OidcAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  beforeEach(() => {
    request
      .mockReset()
      .mockResolvedValue({ isOk: true, data: { items: [], total: 0 } });
  });
  afterAll(async () => {
    await app.close();
  });
  it('uses defaults and returns the page envelope', async () => {
    const response = await app.inject({ method: 'GET', url: '/todos' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, status: 'all' }),
    );
  });
  it.each(['all', 'completed', 'active'])(
    'passes page, limit and %s to the query',
    async (status) => {
      const response = await app.inject({
        method: 'GET',
        url: `/todos?page=2&limit=100&status=${status}`,
      });
      expect(response.statusCode).toBe(200);
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 100, status }),
      );
    },
  );
  it.each([
    'page=0',
    'page=-1',
    'page=1.5',
    'page=abc',
    'page=',
    'page=1e2',
    'page=9007199254740992',
    'page=1&page=2',
    'page=%20',
    'limit=0',
    'limit=-1',
    'limit=101',
    'limit=1.5',
    'limit=abc',
    'limit=',
    'limit=10&limit=20',
    'status=',
    'status=done',
    'status=ALL',
    'status=all&status=active',
  ])('rejects invalid %s with HTTP 400', async (query) => {
    const response = await app.inject({
      method: 'GET',
      url: `/todos?${query}`,
    });
    expect(response.statusCode).toBe(400);
    expect(request).not.toHaveBeenCalled();
  });
  it('preserves filtered total on an empty page', async () => {
    request.mockResolvedValue({ isOk: true, data: { items: [], total: 7 } });
    const response = await app.inject({
      method: 'GET',
      url: '/todos?page=10&limit=2',
    });
    expect(response.json()).toEqual({
      items: [],
      total: 7,
      page: 10,
      limit: 2,
    });
  });
  it('returns HTTP 500 on query failure', async () => {
    request.mockResolvedValue({
      isOk: false,
      error: { message: 'Database failed' },
    });
    expect(
      (await app.inject({ method: 'GET', url: '/todos' })).statusCode,
    ).toBe(500);
  });
});
