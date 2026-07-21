import { existsSync } from "node:fs";
import { resolve } from "node:path";

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

export async function migrateDatabase(): Promise<void> {
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
