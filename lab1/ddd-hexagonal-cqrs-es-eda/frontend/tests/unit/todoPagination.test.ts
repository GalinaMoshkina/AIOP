import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapExternalTodoPage } from '../../src/infra/mappers/TodoMapper';
import reducer, { pageRequested, pageReceived, pageFailed } from '../../src/store/todo/todoReducer';

describe('Todo pagination', () => {
  it('maps items and retains pagination metadata', () => {
    assert.deepEqual(
      mapExternalTodoPage({
        items: [{ id: '1', title: 'Test', completed: true }],
        total: 12,
        page: 2,
        limit: 5,
      }),
      {
        items: [{ id: '1', title: 'Test', isCompleted: true }],
        total: 12,
        page: 2,
        limit: 5,
      }
    );
  });
  it('rejects the old response and malformed pages instead of displaying an empty list', () => {
    for (const data of [{ todos: [] }, undefined, { items: [], page: 1, limit: 20, total: -1 }]) {
      assert.throws(() => mapExternalTodoPage(data));
    }
  });
  it('replaces a page and ignores responses for older requests', () => {
    let state = reducer(undefined, pageRequested({ page: 1, status: 'all', requestId: 'first' }));
    state = reducer(state, pageRequested({ page: 1, status: 'active', requestId: 'second' }));
    const page = {
      items: [{ id: 'a', title: 'Active', isCompleted: false }],
      total: 1,
      page: 1,
      limit: 20,
    };
    state = reducer(state, pageReceived({ ...page, requestId: 'second' }));
    state = reducer(state, pageReceived({ ...page, items: [], requestId: 'first' }));
    state = reducer(state, pageFailed({ requestId: 'first', error: 'stale error' }));
    assert.deepEqual(state.todoIdsState, ['a']);
    assert.equal(state.status, 'active');
    assert.equal(state.total, 1);
    assert.equal(state.error, null);
    state = reducer(state, pageRequested({ page: 2, status: 'active', requestId: 'third' }));
    state = reducer(state, pageReceived({ ...page, items: [], page: 2, requestId: 'third' }));
    assert.deepEqual(state.todosState, []);
    assert.equal(state.page, 2);
  });
});
