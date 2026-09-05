import Database, { type Database as DatabaseType } from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { DB_FILE, ensureOpenChatDirs } from "@/lib/paths";
import * as schema from "./schema";

export type OpenChatDatabase = BetterSQLite3Database<typeof schema>;

declare global {
  // eslint-disable-next-line no-var
  var __openchat_sqlite: DatabaseType | undefined;
  // eslint-disable-next-line no-var
  var __openchat_drizzle: OpenChatDatabase | undefined;
}

/**
 * Initializes tables and indexes in SQLite if they don't already exist.
 */
export function initDatabase(sqliteInstance: DatabaseType): void {
  sqliteInstance.pragma("journal_mode = WAL");
  sqliteInstance.pragma("foreign_keys = ON");
  sqliteInstance.pragma("synchronous = NORMAL");

  sqliteInstance.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      project_id TEXT,
      model TEXT NOT NULL,
      provider TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      parent_id TEXT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      reasoning TEXT,
      tool_calls TEXT,
      citations TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      custom_instructions TEXT,
      default_model TEXT,
      default_provider TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      content TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON sessions(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
  `);
}

/**
 * Returns the raw better-sqlite3 Database instance, reusing singletons in development.
 */
export function getSqlite(): DatabaseType {
  if (process.env.NODE_ENV === "production") {
    ensureOpenChatDirs();
    const instance = new Database(DB_FILE);
    initDatabase(instance);
    return instance;
  }

  if (!globalThis.__openchat_sqlite) {
    ensureOpenChatDirs();
    const instance = new Database(DB_FILE);
    initDatabase(instance);
    globalThis.__openchat_sqlite = instance;
  }

  return globalThis.__openchat_sqlite;
}

/**
 * Returns the Drizzle ORM instance wrapped around the SQLite client.
 */
export function getDb(): OpenChatDatabase {
  if (process.env.NODE_ENV === "production") {
    const sqlite = getSqlite();
    return drizzle(sqlite, { schema });
  }

  if (!globalThis.__openchat_drizzle) {
    const sqlite = getSqlite();
    globalThis.__openchat_drizzle = drizzle(sqlite, { schema });
  }

  return globalThis.__openchat_drizzle;
}

export const sqlite = getSqlite();
export const db = getDb();
