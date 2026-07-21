const MAX_TODO_TITLE_LENGTH = 500;

/**
 * Keeps the title invariant close to the business layer, even when a service
 * is called from somewhere other than the HTTP route.
 */
export function normalizeTodoTitle(title: string): string {
  const normalized = title.trim();

  if (!normalized) {
    throw new RangeError("Todo title cannot be empty");
  }
  if (normalized.length > MAX_TODO_TITLE_LENGTH) {
    throw new RangeError(`Todo title cannot exceed ${MAX_TODO_TITLE_LENGTH} characters`);
  }

  return normalized;
}
