import { describe, expect, test } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  test("joins conditional classes", () => {
    expect(cn("base", null, undefined, { active: true })).toBe("base active");
  });

  test("resolves conflicting Tailwind utilities", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
