import { createAsyncThunk } from '@reduxjs/toolkit';

import { EventBus, Events } from '../../Events';
import TodoRepository from '../../infra/repositories/todo';
import type { RootState } from '../store';
import type { TodoStatus } from '../../infra/interfaces/ITodoRepository';
import todoReducer, {
  pageRequested,
  pageReceived,
  pageFailed,
  setTodoIds,
  setTodos,
  updateTodoTitle,
} from './todoReducer';

const todoRepository = new TodoRepository();
let isSubscribedToTodoEvents = false;

export const loadTodoPage = createAsyncThunk<
  void,
  { page?: number; status?: TodoStatus },
  { state: RootState; rejectValue: string }
>('todo/loadTodoPage', async (options, { dispatch, getState, requestId, rejectWithValue }) => {
  const current = getState().todo;
  const page = options.page ?? current.page;
  const status = options.status ?? current.status;
  dispatch(pageRequested({ page, status, requestId }));
  const response = await todoRepository.getAllTodo(page, current.limit, status);
  if (response.status === 'error') {
    dispatch(pageFailed({ requestId, error: response.error }));
    return rejectWithValue(response.error);
  }
  // A deletion can remove the last item on the last page.
  const lastPage = Math.max(1, Math.ceil(response.total / response.limit));
  if (page > lastPage && getState().todo.requestId === requestId) {
    await dispatch(loadTodoPage({ page: lastPage, status }));
    return;
  }
  dispatch(pageReceived({ ...response, requestId }));
});

export const initTodos = createAsyncThunk<void, void, { state: RootState }>(
  'todo/initTodos',
  async (_, { dispatch }) => {
    if (!isSubscribedToTodoEvents) {
      EventBus.subscribe(Events.TODO_EVENT, () => {
        void dispatch(loadTodoPage({}));
      });
      isSubscribedToTodoEvents = true;
    }
    await dispatch(loadTodoPage({ page: 1, status: 'all' }));
  }
);

export const addTodo = createAsyncThunk<void, string>('todo/addTodo', async (title) => {
  await todoRepository.addTodo(title);
});

export const deleteTodo = createAsyncThunk<void, string>('todo/deleteTodo', async (id) => {
  await todoRepository.deleteTodo(id);
});

export const modifyTodoTitle = createAsyncThunk<void, { id: string; title: string }>(
  'todo/modifyTodoTitle',
  async ({ id, title }) => {
    await todoRepository.modifyTodoTitle(id, title);
  }
);

export const completeTodo = createAsyncThunk<void, string>('todo/completeTodo', async (id) => {
  await todoRepository.completeTodo(id);
});

export const uncompleteTodo = createAsyncThunk<void, string>('todo/uncompleteTodo', async (id) => {
  await todoRepository.uncompleteTodo(id);
});

export { setTodoIds, setTodos, updateTodoTitle };
export default todoReducer;
