import { Elysia, t } from "elysia";

import { authPlugin } from "../plugins/auth";
import { createTodo, deleteTodo, listTodos, updateTodo } from "../services/todos";

const todoParams = t.Object({
  id: t.String({ format: "uuid" }),
});

const todoTitle = t.String({ minLength: 1, maxLength: 500, pattern: "\\S" });

export const todosRoutes = new Elysia({ prefix: "/todos" })
  .use(authPlugin)
  .get("/", ({ user }) => listTodos(user.id), { auth: true })
  .post("/", ({ user, body }) => createTodo(user.id, body.title), {
    auth: true,
    body: t.Object({ title: todoTitle }),
  })
  .patch(
    "/:id",
    async ({ user, params, body, status }) => {
      const updated = await updateTodo(params.id, user.id, body);
      return updated ?? status(404, "Todo not found");
    },
    {
      auth: true,
      params: todoParams,
      body: t.Object(
        {
          title: t.Optional(todoTitle),
          completed: t.Optional(t.Boolean()),
        },
        { minProperties: 1 },
      ),
    },
  )
  .delete(
    "/:id",
    async ({ user, params, status }) => {
      const deleted = await deleteTodo(params.id, user.id);
      return deleted ?? status(404, "Todo not found");
    },
    { auth: true, params: todoParams },
  );
