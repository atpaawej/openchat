import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Base directory for OpenChat data (~/.openchat)
 * Can be overridden via OPENCHAT_HOME or OPENCHAT_DIR environment variables.
 */
export const OPENCHAT_DIR: string =
  process.env["OPENCHAT_HOME"] ||
  process.env["OPENCHAT_DIR"] ||
  path.join(os.homedir(), ".openchat");

/**
 * Path to configuration file (~/.openchat/settings.json)
 */
export const SETTINGS_FILE: string = path.join(OPENCHAT_DIR, "settings.json");

/**
 * Path to SQLite database (~/.openchat/openchat.db)
 */
export const DB_FILE: string = path.join(OPENCHAT_DIR, "openchat.db");

/**
 * Path to uploaded attachments & knowledge files (~/.openchat/uploads)
 */
export const UPLOADS_DIR: string = path.join(OPENCHAT_DIR, "uploads");

/**
 * Ensures that ~/.openchat and all required subdirectories exist.
 * Safe to call multiple times.
 */
export function ensureOpenChatDirs(): {
  openchatDir: string;
  uploadsDir: string;
  settingsFile: string;
  dbFile: string;
} {
  if (!fs.existsSync(OPENCHAT_DIR)) {
    fs.mkdirSync(OPENCHAT_DIR, { recursive: true });
  }

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  return {
    openchatDir: OPENCHAT_DIR,
    uploadsDir: UPLOADS_DIR,
    settingsFile: SETTINGS_FILE,
    dbFile: DB_FILE,
  };
}
