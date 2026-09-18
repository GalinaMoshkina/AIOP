import type { TodoStatus } from '../../../infra/interfaces/ITodoRepository';
import { type JSX } from 'react';
import { Button, HStack, Input, VStack } from '@chakra-ui/react';
import { Tooltip } from '../../ui/Tooltip';

import logo from '../../../assets/bitloops_175x40_transparent.png';
import TodoElement from '../Entry';
import './Panel.css';

interface TodoProps {
  data: string[];
  newTodoTitle: string;
  setNewTodoTitle: React.Dispatch<React.SetStateAction<string>>;
  addItem: () => void;
  page: number;
  totalPages: number;
  total: number;
  status: TodoStatus;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onStatusChange: (status: TodoStatus) => void;
}

const vStackProps = {
  p: '4',
  w: '100%',
  maxW: { base: '90vw', sm: '80vw', lg: '50vw', xl: '40vw' },
  borderColor: 'gray.100',
  borderWidth: '2px',
  borderRadius: 'lg',
  alignItems: 'stretch',
};

function TodoPanel(props: TodoProps): JSX.Element {
  const { data, newTodoTitle, setNewTodoTitle, addItem } = props;

  return (
    <div className="container">
      <VStack {...vStackProps}>
        <div className="heading">
          <img src={logo} alt="Bitloops" className="logo" />
          <h1 className="title">To Do</h1>
        </div>
        {/* Form submit that doesn't reload the page */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addItem();
          }}
        >
          <HStack m="8">
            <Input
              variant="subtle"
              placeholder="Add your new todo here..."
              value={newTodoTitle}
              onChange={(e) => {
                setNewTodoTitle((e.target as HTMLInputElement).value);
              }}
            />
            <Tooltip content="Add Todo">
              <Button type="submit" colorScheme="green" px="8">
                Add Todo
              </Button>
            </Tooltip>
          </HStack>
        </form>
        <label>
          Status
          <select
            aria-label="Todo status"
            value={props.status}
            onChange={(event) => props.onStatusChange(event.target.value as TodoStatus)}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
          </select>
        </label>
        {props.error && <p role="alert">{props.error}</p>}
        {props.loading && <p role="status">Loading…</p>}
        <div
          className="todo-list"
          style={{ height: 300, overflowY: 'auto' }}
          aria-busy={props.loading}
        >
          <ul>{data && data.map((id) => <TodoElement key={id} id={id} />)}</ul>
        </div>
        <HStack>
          <Button
            disabled={props.loading || props.page <= 1}
            onClick={() => props.onPageChange(props.page - 1)}
          >
            Previous
          </Button>
          <span>
            Page {props.page} of {props.totalPages} · {props.total} todos
          </span>
          <Button
            disabled={props.loading || props.page >= props.totalPages}
            onClick={() => props.onPageChange(props.page + 1)}
          >
            Next
          </Button>
        </HStack>
      </VStack>
    </div>
  );
}

export default TodoPanel;
