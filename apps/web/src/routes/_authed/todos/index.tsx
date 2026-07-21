import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import { todosQueryOptions, useDeleteTodo, useUpdateTodo } from "#/lib/todos";

export const Route = createFileRoute("/_authed/todos/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(todosQueryOptions),
  component: TodosPage,
});

function TodosPage() {
  const { data: todos } = useSuspenseQuery(todosQueryOptions);
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const remaining = todos.filter((todo) => !todo.completed).length;

  return (
    <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Todo list</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep track of what is done and what comes next.
          </p>
        </div>
        <Button render={<Link to="/todos/new" />}>
          <Plus data-icon="inline-start" />
          New todo
        </Button>
      </div>

      <Card className="mt-6 py-0">
        <CardContent className="p-0">
          {todos.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">No todos yet.</p>
              <Button variant="outline" className="mt-4" render={<Link to="/todos/new" />}>
                Create your first todo
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {todos.map((todo) => (
                <li key={todo.id} className="flex items-center gap-3 px-4 py-3">
                  <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.completed}
                    onCheckedChange={(checked) =>
                      updateTodo.mutate({
                        id: todo.id,
                        completed: checked === true,
                      })
                    }
                  />
                  <label
                    htmlFor={`todo-${todo.id}`}
                    className={`flex-1 text-sm ${
                      todo.completed ? "text-muted-foreground line-through" : ""
                    }`}
                  >
                    {todo.title}
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete "${todo.title}"`}
                    onClick={() => deleteTodo.mutate(todo.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {todos.length > 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          {remaining} of {todos.length} remaining
        </p>
      )}
    </main>
  );
}
