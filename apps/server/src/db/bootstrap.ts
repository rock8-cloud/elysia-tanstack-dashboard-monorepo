import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { auth } from "../lib/auth";
import { db } from "./client";
import { findUserByEmail } from "./queries/users";

function findMigrationsFolder(): string {
  const candidates = [
    resolve(import.meta.dir, "../../drizzle"), // running from src/db
    resolve(import.meta.dir, "../drizzle"), // running from dist
  ];
  const migrationsFolder = candidates.find(existsSync);

  if (!migrationsFolder) {
    throw new Error("Could not find the Drizzle migrations folder");
  }

  return migrationsFolder;
}

const DATABASE_WAIT_MS = 60_000;
const DATABASE_RETRY_MS = 2_000;
// A database deployed together with the API can still be starting when the API boots.
const STARTING_UP_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "57P03",
]);

function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  if ("cause" in error) return errorCode(error.cause);
  return undefined;
}

async function waitForDatabase(): Promise<void> {
  const deadline = Date.now() + DATABASE_WAIT_MS;
  for (;;) {
    try {
      await db.execute(sql`select 1`);
      return;
    } catch (error) {
      const code = errorCode(error);
      if (!code || !STARTING_UP_CODES.has(code) || Date.now() >= deadline) throw error;
      console.log(`Database not reachable yet (${code}), retrying`);
      await Bun.sleep(DATABASE_RETRY_MS);
    }
  }
}

export async function migrateDatabase(): Promise<void> {
  await waitForDatabase();
  await migrate(db, { migrationsFolder: findMigrationsFolder() });
  console.log("Database migrations applied");
}

function requiredSeedValue(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required when SEED_DEFAULT_USER=true`);
  }
  return value;
}

export async function seedDefaultUser(): Promise<void> {
  if (process.env.SEED_DEFAULT_USER !== "true") {
    return;
  }

  const seedUser = {
    name: requiredSeedValue("SEED_USER_NAME"),
    email: requiredSeedValue("SEED_USER_EMAIL"),
    password: requiredSeedValue("SEED_USER_PASSWORD"),
  };
  const existingUser = await findUserByEmail(seedUser.email);

  if (existingUser) {
    console.log(`Seed user already exists: ${seedUser.email}`);
    return;
  }

  await auth.api.signUpEmail({ body: seedUser });
  console.log(`Created seed user: ${seedUser.email}`);
}

export async function bootstrapDatabase(): Promise<void> {
  await migrateDatabase();
  await seedDefaultUser();
}
