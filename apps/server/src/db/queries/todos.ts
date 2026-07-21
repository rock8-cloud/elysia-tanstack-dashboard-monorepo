import { and, desc, eq } from "drizzle-orm";

import { db } from "../client";
import { todo, type Todo } from "../schema/todos";

export function findTodosByUserId(userId: string): Promise<Todo[]> {
  return db.select().from(todo).where(eq(todo.userId, userId)).orderBy(desc(todo.createdAt));
}

export async function insertTodo(values: { userId: string; title: string }): Promise<Todo> {
  const [created] = await db.insert(todo).values(values).returning();
  if (!created) {
    throw new Error("Insert returned no rows");
  }
  return created;
}

export async function updateTodoForUser(
  id: string,
  userId: string,
  values: Partial<Pick<Todo, "title" | "completed">>,
): Promise<Todo | null> {
  const [updated] = await db
    .update(todo)
    .set(values)
    .where(and(eq(todo.id, id), eq(todo.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteTodoForUser(id: string, userId: string): Promise<Todo | null> {
  const [deleted] = await db
    .delete(todo)
    .where(and(eq(todo.id, id), eq(todo.userId, userId)))
    .returning();
  return deleted ?? null;
}
