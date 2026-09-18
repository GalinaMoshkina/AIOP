import { useState, type JSX } from 'react';

import TodoPanelComponent from './TodoPanelComponent';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../store/store';
import { addTodo, loadTodoPage } from '../../../store/todo/todoSlice';

function TodoPanelController(): JSX.Element {
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');
  const { todoIdsState, page, limit, total, status, loading, error } = useSelector(
    (state: RootState) => state.todo
  );
  const dispatch = useDispatch<AppDispatch>();

  const addItem = () => {
    if (newTodoTitle) dispatch(addTodo(newTodoTitle));
    setNewTodoTitle('');
  };

  return (
    <TodoPanelComponent
      data={todoIdsState}
      newTodoTitle={newTodoTitle}
      setNewTodoTitle={setNewTodoTitle}
      addItem={addItem}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / limit))}
      total={total}
      status={status}
      loading={loading}
      error={error}
      onPageChange={(page) => void dispatch(loadTodoPage({ page }))}
      onStatusChange={(status) => void dispatch(loadTodoPage({ page: 1, status }))}
    />
  );
}

export default TodoPanelController;
