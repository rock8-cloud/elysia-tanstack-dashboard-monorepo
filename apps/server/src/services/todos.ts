import {
  deleteTodoForUser,
  findTodosByUserId,
  insertTodo,
  updateTodoForUser,
} from "../db/queries/todos";
import type { Todo } from "../db/schema/todos";

import { normalizeTodoTitle } from "./todo-title";

export function listTodos(userId: string): Promise<Todo[]> {
  return findTodosByUserId(userId);
}

export function createTodo(userId: string, title: string): Promise<Todo> {
  return insertTodo({ userId, title: normalizeTodoTitle(title) });
}

export function updateTodo(
  id: string,
  userId: string,
  values: { title?: string; completed?: boolean },
): Promise<Todo | null> {
  return updateTodoForUser(id, userId, {
    ...values,
    ...(values.title !== undefined && { title: normalizeTodoTitle(values.title) }),
  });
}

export function deleteTodo(id: string, userId: string): Promise<Todo | null> {
  return deleteTodoForUser(id, userId);
}
