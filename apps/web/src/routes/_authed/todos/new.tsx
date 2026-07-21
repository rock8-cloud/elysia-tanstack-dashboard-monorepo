import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { useCreateTodo } from "#/lib/todos";

import type { FormEvent } from "react";

export const Route = createFileRoute("/_authed/todos/new")({
  component: NewTodoPage,
});

function NewTodoPage() {
  const navigate = Route.useNavigate();
  const createTodo = useCreateTodo();
  const [title, setTitle] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }

    createTodo.mutate(trimmed, {
      onSuccess: () => navigate({ to: "/todos" }),
    });
  }

  return (
    <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">New todo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a clear, actionable item to your list.
        </p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Todo details</CardTitle>
            <CardDescription>Give the item a short and descriptive title.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What needs to be done?"
                  maxLength={500}
                  autoFocus
                  required
                />
              </div>

              {createTodo.isError && (
                <p className="text-sm text-destructive">Could not create the todo. Try again.</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={createTodo.isPending || !title.trim()}>
                  {createTodo.isPending ? "Creating…" : "Create todo"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate({ to: "/todos" })}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
