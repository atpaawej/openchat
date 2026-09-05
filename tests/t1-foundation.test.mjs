import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Configure a temporary directory for test isolation
const testHome = fs.mkdtempSync(path.join(os.tmpdir(), "openchat-test-"));
process.env["OPENCHAT_HOME"] = path.join(testHome, ".openchat");

// Test 1: Paths Management
test("lib/paths manages directories correctly", async () => {
  const { ensureOpenChatDirs, OPENCHAT_DIR, SETTINGS_FILE, DB_FILE, UPLOADS_DIR } =
    await import("../src/lib/paths.js");

  assert.equal(OPENCHAT_DIR, path.join(testHome, ".openchat"));
  assert.equal(SETTINGS_FILE, path.join(OPENCHAT_DIR, "settings.json"));
  assert.equal(DB_FILE, path.join(OPENCHAT_DIR, "openchat.db"));
  assert.equal(UPLOADS_DIR, path.join(OPENCHAT_DIR, "uploads"));

  const dirs = ensureOpenChatDirs();
  assert.ok(fs.existsSync(OPENCHAT_DIR));
  assert.ok(fs.existsSync(UPLOADS_DIR));
  assert.equal(dirs.openchatDir, OPENCHAT_DIR);
});

// Test 2: Settings and Config File
test("features/settings/config-file loads, saves, and merges env vars", async () => {
  process.env["OPENAI_API_KEY"] = "sk-test-key-12345";
  process.env["OPENCHAT_DEFAULT_MODEL"] = "gpt-4o-mini";

  const { loadSettings, saveSettings, getDefaultSettings } = await import(
    "../src/features/settings/config-file.js"
  );

  const initial = loadSettings();
  assert.equal(initial.defaultModel, "gpt-4o-mini");
  assert.equal(initial.providers.openai.apiKey, "sk-test-key-12345");
  assert.equal(initial.providers.openai.enabled, true);

  // Test saving customized settings
  saveSettings({
    theme: "dark",
    defaultModel: "claude-3-7-sonnet-latest",
  });

  const updated = loadSettings();
  assert.equal(updated.theme, "dark");
  assert.equal(updated.defaultModel, "claude-3-7-sonnet-latest");
});

// Test 3: Database and Schema
test("lib/db initializes tables and executes CRUD operations with WAL mode", async () => {
  const { getDb, getSqlite } = await import("../src/lib/db/client.js");
  const { sessions, messages, projects, projectFiles } = await import(
    "../src/lib/db/schema.js"
  );

  const sqlite = getSqlite();
  const db = getDb();

  // Verify WAL mode
  const journalMode = sqlite.pragma("journal_mode", { simple: true });
  assert.equal(journalMode, "wal");

  // Verify Project insertion
  const now = new Date();
  const projectId = "proj_test_1";
  db.insert(projects)
    .values({
      id: projectId,
      name: "Test Project",
      description: "Test Description",
      customInstructions: "You are a test assistant.",
      defaultModel: "gpt-4o",
      defaultProvider: "openai",
      createdAt: now,
    })
    .run();

  const fetchedProject = db
    .select()
    .from(projects)
    .all();
  assert.equal(fetchedProject.length, 1);
  assert.equal(fetchedProject[0]?.name, "Test Project");

  // Verify Project File insertion
  db.insert(projectFiles)
    .values({
      id: "file_test_1",
      projectId: projectId,
      filename: "test.txt",
      content: "Hello World",
      size: 11,
      createdAt: now,
    })
    .run();

  const fetchedFiles = db.select().from(projectFiles).all();
  assert.equal(fetchedFiles.length, 1);
  assert.equal(fetchedFiles[0]?.filename, "test.txt");

  // Verify Session insertion
  const sessionId = "session_test_1";
  db.insert(sessions)
    .values({
      id: sessionId,
      title: "Test Session",
      projectId: projectId,
      model: "gpt-4o",
      provider: "openai",
      pinned: true,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const fetchedSessions = db.select().from(sessions).all();
  assert.equal(fetchedSessions.length, 1);
  assert.equal(fetchedSessions[0]?.title, "Test Session");
  assert.equal(fetchedSessions[0]?.pinned, true);

  // Verify Messages with branching parentId
  db.insert(messages)
    .values({
      id: "msg_1",
      sessionId: sessionId,
      parentId: null,
      role: "user",
      content: "Hello",
      createdAt: now,
    })
    .run();

  db.insert(messages)
    .values({
      id: "msg_2",
      sessionId: sessionId,
      parentId: "msg_1",
      role: "assistant",
      content: "Hi! How can I help you?",
      reasoning: "Thinking about response...",
      toolCalls: JSON.stringify([{ id: "tc_1", name: "calculator", args: { expr: "2+2" } }]),
      citations: JSON.stringify([{ title: "Ref", url: "https://example.com" }]),
      createdAt: now,
    })
    .run();

  const fetchedMessages = db.select().from(messages).all();
  assert.equal(fetchedMessages.length, 2);
  assert.equal(fetchedMessages[1]?.parentId, "msg_1");
  assert.equal(fetchedMessages[1]?.role, "assistant");
  assert.ok(fetchedMessages[1]?.reasoning?.includes("Thinking"));
});

// Test 4: CLI Executable
test("bin/openchat.js responds to --help and --version", async () => {
  const { execSync } = await import("node:child_process");
  const binPath = path.resolve("./bin/openchat.js");

  const helpOutput = execSync(`node "${binPath}" --help`, { encoding: "utf-8" });
  assert.ok(helpOutput.includes("Usage: openchat"));
  assert.ok(helpOutput.includes("-p, --port <number>"));
  assert.ok(helpOutput.includes("-H, --host <string>"));
  assert.ok(helpOutput.includes("--no-open"));

  const versionOutput = execSync(`node "${binPath}" --version`, { encoding: "utf-8" });
  assert.ok(versionOutput.includes("0.1.0"));
});

