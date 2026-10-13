import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Patch,
  HttpException,
  HttpCode,
  HttpStatus,
  Inject,
  Injectable,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AddTodoRequestDto } from './dto/add-todo.dto';
import { ModifyTodoTitleRequestDto } from './dto/modify-todo-title.dto';
import { BUSES_TOKENS } from '../lib/infra/nest-jetstream';
import { OidcAuthGuard } from '@src/bounded-contexts/iam/iam/oidc/oidc-auth.guard';
import { Infra } from 'ddd-tactical-core-boilerplate';
import { GetAllTodosResponseDto } from './dto/get-all-todos.dto';
import { CompleteTodoCommand } from '@src/lib/bounded-contexts/todo/todo/commands/complete-todo.command';
import { AddTodoCommand } from '@src/lib/bounded-contexts/todo/todo/commands/add-todo.command';
import {
  GetTodosQuery,
  TodoListStatus,
} from '@src/lib/bounded-contexts/todo/todo/queries/get-todos.query';
import { UncompleteTodoCommand } from '@src/lib/bounded-contexts/todo/todo/commands/uncomplete-todo.command';
import { DeleteTodoCommand } from '@src/lib/bounded-contexts/todo/todo/commands/delete-todo.command';
import { ModifyTodoTitleCommand } from '@src/lib/bounded-contexts/todo/todo/commands/modify-todo-title.command';

@ApiTags('todos')
@ApiBearerAuth()
@Controller('todos')
@UseGuards(OidcAuthGuard)
@Injectable()
export class TodoController {
  constructor(
    @Inject(BUSES_TOKENS.PUBSUB_COMMAND_BUS)
    private readonly commandBus: Infra.CommandBus.IPubSubCommandBus,
    @Inject(BUSES_TOKENS.PUBSUB_QUERY_BYS)
    private readonly queryBus: Infra.QueryBus.IQueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiResponse({ status: 201, description: 'Todo created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async addTodo(@Body() dto: AddTodoRequestDto) {
    const command = new AddTodoCommand({ title: dto.title });
    const result = await this.commandBus.request(command);

    if (result.isOk) {
      return { id: result.data };
    } else {
      throw new HttpException(
        result.error?.message || 'Failed to create todo',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all todos' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['all', 'completed', 'active'],
    example: 'all',
  })
  @ApiResponse({
    status: 200,
    type: GetAllTodosResponseDto,
    description: 'Returns all todos',
  })
  @ApiResponse({ status: 400, description: 'Invalid pagination or filter parameter' })
  async getAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status', new DefaultValuePipe('all')) status: TodoListStatus,
  ) {
    this.validateListQuery(page, limit, status);
    const results = await this.queryBus.request(
      new GetTodosQuery(page, limit, status),
    );
    if (results.isOk) {
      return new GetAllTodosResponseDto({
        items: results.data.items,
        total: results.data.total,
        page,
        limit,
      });
    } else {
      throw new HttpException(
        results.error?.message || 'Failed to fetch todos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private validateListQuery(
    page: number,
    limit: number,
    status: TodoListStatus,
  ): void {
    if (page < 1) throw new BadRequestException('page must be at least 1');
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('limit must be between 1 and 100');
    }
    if (!['all', 'completed', 'active'].includes(status)) {
      throw new BadRequestException('status must be all, completed or active');
    }
  }

  @Patch(':id/complete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a todo as completed' })
  @ApiParam({ name: 'id', description: 'Todo ID' })
  @ApiResponse({ status: 204, description: 'Todo marked as completed' })
  @ApiResponse({ status: 400, description: 'Invalid todo ID' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async completeTodo(@Param('id') id: string) {
    const command = new CompleteTodoCommand({ todoId: id });
    const result = await this.commandBus.request(command);

    if (!result.isOk) {
      throw new HttpException(
        result.error?.message || 'Failed to complete todo',
        result.error?.code === 'TODO_NOT_FOUND'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/uncomplete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a todo as uncompleted' })
  @ApiParam({ name: 'id', description: 'Todo ID' })
  @ApiResponse({ status: 204, description: 'Todo marked as uncompleted' })
  @ApiResponse({ status: 400, description: 'Invalid todo ID' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async uncompleteTodo(@Param('id') id: string) {
    const command = new UncompleteTodoCommand({ id });
    const result = await this.commandBus.request(command);

    if (!result.isOk) {
      throw new HttpException(
        result.error?.message || 'Failed to uncomplete todo',
        result.error?.code === 'TODO_NOT_FOUND'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/title')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a todo title' })
  @ApiParam({ name: 'id', description: 'Todo ID' })
  @ApiResponse({ status: 204, description: 'Todo title updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async modifyTitle(@Param('id') id: string, @Body() dto: ModifyTodoTitleRequestDto) {
    const command = new ModifyTodoTitleCommand({
      id,
      title: dto.title,
    });

    const result = await this.commandBus.request(command);

    if (!result.isOk) {
      throw new HttpException(
        result.error?.message || 'Failed to update todo title',
        result.error?.code === 'TODO_NOT_FOUND'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiParam({ name: 'id', description: 'Todo ID' })
  @ApiResponse({ status: 204, description: 'Todo deleted' })
  @ApiResponse({ status: 400, description: 'Invalid todo ID' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async deleteTodo(@Param('id') id: string) {
    const command = new DeleteTodoCommand({ id });
    const result = await this.commandBus.request(command);

    if (!result.isOk) {
      throw new HttpException(
        result.error?.message || 'Failed to delete todo',
        result.error?.code === 'TODO_NOT_FOUND'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST,
      );
    }
  }
}
