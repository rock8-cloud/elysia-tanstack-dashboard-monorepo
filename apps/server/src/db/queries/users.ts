import { eq } from "drizzle-orm";

import { db } from "../client";
import { user } from "../schema/auth";

export async function findUserByEmail(email: string) {
  const [existingUser] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  return existingUser ?? null;
}
