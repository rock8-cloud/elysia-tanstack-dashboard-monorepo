import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const todo = pgTable("todo", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Todo = typeof todo.$inferSelect;
