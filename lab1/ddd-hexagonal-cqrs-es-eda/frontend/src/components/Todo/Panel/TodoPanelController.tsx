import { useState, type JSX, type UIEvent } from 'react';

import TodoPanelComponent from './TodoPanelComponent';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../store/store';
import { addTodo, loadMoreTodos } from '../../../store/todo/todoSlice';

function TodoPanelController(): JSX.Element {
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');
  const { todoIdsState } = useSelector((state: RootState) => state.todo)
  const dispatch = useDispatch<AppDispatch>();


  const loadTodos = async () => {
    const limit = 5;
    dispatch(loadMoreTodos({ page: Math.floor(todoIdsState.length / limit) + 1, limit }));
  };

  const addItem = () => {
    if (newTodoTitle) dispatch(addTodo(newTodoTitle))
    setNewTodoTitle('');
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadTodos();
    }
    console.log(scrollHeight - scrollTop - clientHeight < 50);

  };

  return (
    <TodoPanelComponent
      data={todoIdsState}
      newTodoTitle={newTodoTitle}
      setNewTodoTitle={setNewTodoTitle}
      addItem={addItem}
      onScroll={handleScroll}
    />
  );
}

export default TodoPanelController;
