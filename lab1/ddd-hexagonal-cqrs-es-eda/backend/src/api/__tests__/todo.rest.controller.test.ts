import { BadRequestException } from '@nestjs/common';
import { TodoController } from '../todo.rest.controller';

describe('TodoController', () => {
  const commandBus = { request: jest.fn() };
  const queryBus = { request: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated todo response', async () => {
    queryBus.request.mockResolvedValue({
      isOk: true,
      data: {
        items: [
          {
            id: '10000000-0000-4000-8000-000000000001',
            userId: '10000000-0000-4000-8000-000000000002',
            title: 'todo title',
            completed: false,
          },
        ],
        total: 3,
      },
    });
    const controller = new TodoController(commandBus as never, queryBus as never);

    await expect(controller.getAll(2, 1, 'active')).resolves.toEqual({
      items: [
        {
          id: '10000000-0000-4000-8000-000000000001',
          title: 'todo title',
          completed: false,
        },
      ],
      total: 3,
      page: 2,
      limit: 1,
    });
    expect(queryBus.request).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 1, status: 'active' }),
    );
  });

  it.each([
    [0, 20, 'all'],
    [1, 0, 'all'],
    [1, 101, 'all'],
    [1, 20, 'done'],
  ])(
    'rejects invalid list params: page=%s, limit=%s, status=%s',
    async (page, limit, status) => {
      const controller = new TodoController(commandBus as never, queryBus as never);

      await expect(
        controller.getAll(page as number, limit as number, status as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(queryBus.request).not.toHaveBeenCalled();
    },
  );
});
