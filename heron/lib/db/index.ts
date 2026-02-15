import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { migrateIfNeeded } from "./migrate";

let dbInstance: ReturnType<typeof drizzle> | null = null;
let rawDb: Database.Database | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = process.env.CMS_DB_PATH || path.join(process.cwd(), "data", "cms.db");
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  migrateIfNeeded(sqlite);

  rawDb = sqlite;
  dbInstance = drizzle(sqlite);
  return dbInstance;
}

/** Raw DB for FTS and other raw SQL. Call getDb() first to ensure migrations ran. */
export function getRawDb(): Database.Database {
  if (!rawDb) getDb();
  return rawDb!;
}
