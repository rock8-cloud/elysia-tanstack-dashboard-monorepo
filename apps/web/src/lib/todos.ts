import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "./api";

export const todosQueryOptions = queryOptions({
  queryKey: ["todos"],
  queryFn: async () => {
    const { data, error } = await api.todos.get();
    if (error) {
      throw new Error("Failed to load todos");
    }
    return data;
  },
});

function useInvalidateTodos() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: todosQueryOptions.queryKey });
}

export function useCreateTodo() {
  const invalidateTodos = useInvalidateTodos();
  return useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await api.todos.post({ title });
      if (error) {
        throw new Error("Failed to create todo");
      }
      return data;
    },
    onSuccess: async () => {
      await invalidateTodos();
      toast.success("Todo created");
    },
  });
}

export function useUpdateTodo() {
  const invalidateTodos = useInvalidateTodos();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; title?: string; completed?: boolean }) => {
      const { data, error } = await api.todos({ id }).patch(values);
      if (error) {
        throw new Error("Failed to update todo");
      }
      return data;
    },
    onSuccess: async () => {
      await invalidateTodos();
      toast.success("Todo updated");
    },
  });
}

export function useDeleteTodo() {
  const invalidateTodos = useInvalidateTodos();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.todos({ id }).delete();
      if (error) {
        throw new Error("Failed to delete todo");
      }
      return data;
    },
    onSuccess: async () => {
      await invalidateTodos();
      toast.success("Todo deleted");
    },
  });
}
