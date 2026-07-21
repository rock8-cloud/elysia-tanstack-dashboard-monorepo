import { describe, expect, test } from "bun:test";

import { normalizeTodoTitle } from "./todo-title";

describe("normalizeTodoTitle", () => {
  test("trims a valid title", () => {
    expect(normalizeTodoTitle("  Ship the starter  ")).toBe("Ship the starter");
  });

  test("rejects whitespace-only titles", () => {
    expect(() => normalizeTodoTitle("   ")).toThrow("Todo title cannot be empty");
  });

  test("rejects titles longer than 500 characters", () => {
    expect(() => normalizeTodoTitle("a".repeat(501))).toThrow(
      "Todo title cannot exceed 500 characters",
    );
  });
});
