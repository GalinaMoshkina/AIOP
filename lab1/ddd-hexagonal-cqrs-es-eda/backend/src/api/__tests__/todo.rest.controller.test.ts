import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { BUSES_TOKENS } from '../../lib/infra/nest-jetstream';
import { OidcAuthGuard } from '../../bounded-contexts/iam/iam/oidc/oidc-auth.guard';
import { TodoController } from '../todo.rest.controller';

describe('TodoController getAll', () => {
  let app: NestFastifyApplication;
  const queryBus = { request: jest.fn() };
  const commandBus = { request: jest.fn() };

  beforeEach(async () => {
    queryBus.request.mockResolvedValue({
      isOk: true,
      data: {
        items: [
          {
            id: '9d8c876a-7d2f-41ef-99bb-34d03ef6ef9b',
            userId: 'bbf743d0-0a05-4095-bd9e-f67466a281b6',
            title: 'Only visible todo',
            completed: false,
          },
        ],
        total: 7,
        page: 2,
        limit: 3,
      },
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [
        {
          provide: BUSES_TOKENS.PUBSUB_COMMAND_BUS,
          useValue: commandBus,
        },
        {
          provide: BUSES_TOKENS.PUBSUB_QUERY_BYS,
          useValue: queryBus,
        },
      ],
    })
      .overrideGuard(OidcAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('returns paginated todos in the public response shape', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/todos?page=2&limit=3&status=active',
    });

    expect(response.statusCode).toBe(200);
    expect(queryBus.request).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 3, status: 'active' }),
    );
    expect(response.json()).toEqual({
      items: [
        {
          id: '9d8c876a-7d2f-41ef-99bb-34d03ef6ef9b',
          title: 'Only visible todo',
          completed: false,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        },
      ],
      total: 7,
      page: 2,
      limit: 3,
    });
  });

  it('uses defaults when query parameters are omitted', async () => {
    const response = await app.inject({ method: 'GET', url: '/todos' });

    expect(response.statusCode).toBe(200);
    expect(queryBus.request).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, status: 'all' }),
    );
  });

  it.each([
    '/todos?page=0',
    '/todos?page=1.5',
    '/todos?page=abc',
    '/todos?limit=0',
    '/todos?limit=101',
    '/todos?limit=ten',
    '/todos?status=done',
    '/todos?foo=bar',
  ])('rejects invalid query parameters: %s', async (url) => {
    const response = await app.inject({ method: 'GET', url });

    expect(response.statusCode).toBe(400);
    expect(queryBus.request).not.toHaveBeenCalled();
  });
});
