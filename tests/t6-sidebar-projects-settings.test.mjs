import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

test("Sidebar: Session bucketing (Today, Yesterday, 7 Days, 30 Days, Pinned, Older)", async () => {
  const { getTimeBucket, groupSessionsByBucket } = await import(
    "../src/features/sidebar/types"
  );

  const now = new Date("2026-09-05T12:00:00Z").getTime();
  const oneHourAgo = now - 1 * 60 * 60 * 1000;
  const yesterdayTime = now - 26 * 60 * 60 * 1000;
  const fourDaysAgo = now - 4 * 24 * 60 * 60 * 1000;
  const fifteenDaysAgo = now - 15 * 24 * 60 * 60 * 1000;
  const fortyDaysAgo = now - 40 * 24 * 60 * 60 * 1000;

  // Verify individual time bucket assignment
  assert.equal(getTimeBucket(oneHourAgo, now), "Today");
  assert.equal(getTimeBucket(yesterdayTime, now), "Yesterday");
  assert.equal(getTimeBucket(fourDaysAgo, now), "Previous 7 Days");
  assert.equal(getTimeBucket(fifteenDaysAgo, now), "Previous 30 Days");
  assert.equal(getTimeBucket(fortyDaysAgo, now), "Older");

  // Verify groupSessionsByBucket
  const mockSessions = [
    {
      id: "sess-pinned",
      title: "Pinned Chat",
      model: "gpt-4o",
      provider: "openai",
      pinned: true,
      createdAt: fifteenDaysAgo,
      updatedAt: fifteenDaysAgo,
    },
    {
      id: "sess-today",
      title: "Today Chat",
      model: "gpt-4o",
      provider: "openai",
      pinned: false,
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo,
    },
    {
      id: "sess-yesterday",
      title: "Yesterday Chat",
      model: "gpt-4o",
      provider: "openai",
      pinned: false,
      createdAt: yesterdayTime,
      updatedAt: yesterdayTime,
    },
    {
      id: "sess-7days",
      title: "7 Days Chat",
      model: "gpt-4o",
      provider: "openai",
      pinned: false,
      createdAt: fourDaysAgo,
      updatedAt: fourDaysAgo,
    },
    {
      id: "sess-30days",
      title: "30 Days Chat",
      model: "gpt-4o",
      provider: "openai",
      pinned: false,
      createdAt: fifteenDaysAgo,
      updatedAt: fifteenDaysAgo,
    },
    {
      id: "sess-older",
      title: "Older Chat",
      model: "gpt-4o",
      provider: "openai",
      pinned: false,
      createdAt: fortyDaysAgo,
      updatedAt: fortyDaysAgo,
    },
  ];

  const grouped = groupSessionsByBucket(mockSessions, now);

  const bucketNames = grouped.map((g) => g.bucket);
  assert.deepEqual(bucketNames, [
    "Pinned",
    "Today",
    "Yesterday",
    "Previous 7 Days",
    "Previous 30 Days",
    "Older",
  ]);

  const pinnedGroup = grouped.find((g) => g.bucket === "Pinned");
  assert.equal(pinnedGroup?.sessions.length, 1);
  assert.equal(pinnedGroup?.sessions[0]?.id, "sess-pinned");

  const todayGroup = grouped.find((g) => g.bucket === "Today");
  assert.equal(todayGroup?.sessions.length, 1);
  assert.equal(todayGroup?.sessions[0]?.id, "sess-today");
});

test("Projects: Repository CRUD, Knowledge Base attachments, and Prompt injection", async () => {
  const { projectRepository } = await import(
    "../src/features/projects/server/project-repository"
  );

  // 1. Create Project
  const created = projectRepository.createProject({
    name: "AI Agents Research",
    description: "Multi-agent systems and MCP protocols",
    customInstructions: "You are a specialist in autonomous agent architectures.",
    defaultModel: "claude-3-5-sonnet-latest",
    defaultProvider: "anthropic",
  });

  assert.ok(created.id);
  assert.equal(created.name, "AI Agents Research");
  assert.equal(created.defaultModel, "claude-3-5-sonnet-latest");

  // 2. Fetch Project
  const fetched = projectRepository.getProject(created.id);
  assert.ok(fetched);
  assert.equal(fetched.name, "AI Agents Research");

  // 3. Update Project
  const updated = projectRepository.updateProject(created.id, {
    name: "AI Agents & Tool Systems",
    description: "Updated description",
  });
  assert.equal(updated?.name, "AI Agents & Tool Systems");
  assert.equal(updated?.description, "Updated description");

  // 4. Attach Knowledge Files
  const file1 = projectRepository.addProjectFile({
    projectId: created.id,
    filename: "specs.md",
    content: "# System Specifications\nAgents communicate via Model Context Protocol.",
  });
  assert.ok(file1.id);
  assert.equal(file1.filename, "specs.md");

  const file2 = projectRepository.addProjectFile({
    projectId: created.id,
    filename: "architecture.txt",
    content: "Subagents execute tasks concurrently.",
  });

  const files = projectRepository.listProjectFiles(created.id);
  assert.equal(files.length, 2);

  // 5. Test Knowledge Prompt Injection
  const knowledgePrompt = projectRepository.getProjectKnowledgePrompt(created.id);
  assert.ok(knowledgePrompt.includes("## Project Instructions"));
  assert.ok(knowledgePrompt.includes("You are a specialist in autonomous agent architectures."));
  assert.ok(knowledgePrompt.includes("## Project Knowledge Base"));
  assert.ok(knowledgePrompt.includes("specs.md"));
  assert.ok(knowledgePrompt.includes("architecture.txt"));

  // 6. Delete file and Project
  projectRepository.deleteProjectFile(file1.id);
  const remainingFiles = projectRepository.listProjectFiles(created.id);
  assert.equal(remainingFiles.length, 1);
  assert.equal(remainingFiles[0]?.id, file2.id);

  projectRepository.deleteProject(created.id);
  assert.equal(projectRepository.getProject(created.id), null);
  assert.equal(projectRepository.listProjectFiles(created.id).length, 0);
});

test("Sessions & Messages: MessageRepository and /api/sessions routes", async () => {
  const { messageRepository } = await import(
    "../src/features/chat/server/message-repository"
  );
  const { GET: getSessions } = await import("../src/app/api/sessions/route");
  const {
    GET: getSessionById,
    PATCH: patchSessionById,
    DELETE: deleteSessionById,
  } = await import("../src/app/api/sessions/[id]/route");

  const testSessionId = `test_sess_${Date.now()}`;

  // 1. Create Session
  const session = messageRepository.createSession({
    id: testSessionId,
    title: "Initial Session Title",
    model: "gpt-4o",
    provider: "openai",
  });
  assert.equal(session.title, "Initial Session Title");

  // 2. Save Message
  messageRepository.saveMessage({
    id: `msg_1_${Date.now()}`,
    sessionId: testSessionId,
    role: "user",
    content: "Hello from test",
  });

  // 3. Test GET /api/sessions route
  const req = new NextRequest("http://localhost:3000/api/sessions");
  const getRes = await getSessions(req);
  assert.equal(getRes.status, 200);
  const data = await getRes.json();
  assert.ok(Array.isArray(data.sessions));
  const found = data.sessions.find((s) => s.id === testSessionId);
  assert.ok(found);
  assert.equal(found.title, "Initial Session Title");

  // 4. Test PATCH /api/sessions/[id] (rename & pin)
  const patchReq = new NextRequest(`http://localhost:3000/api/sessions/${testSessionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      title: "Updated Renamed Title",
      pinned: true,
    }),
  });
  const patchRes = await patchSessionById(patchReq, {
    params: Promise.resolve({ id: testSessionId }),
  });
  assert.equal(patchRes.status, 200);
  const patchData = await patchRes.json();
  assert.equal(patchData.session.title, "Updated Renamed Title");
  assert.equal(patchData.session.pinned, true);

  // 5. Test DELETE /api/sessions/[id]
  const deleteReq = new NextRequest(`http://localhost:3000/api/sessions/${testSessionId}`, {
    method: "DELETE",
  });
  const deleteRes = await deleteSessionById(deleteReq, {
    params: Promise.resolve({ id: testSessionId }),
  });
  assert.equal(deleteRes.status, 200);

  // Verify session and messages are deleted from SQLite
  assert.equal(messageRepository.getSession(testSessionId), null);
  assert.equal(messageRepository.getMessages(testSessionId).length, 0);
});

test("Settings & Data Controls: /api/settings GET/POST, Export, and Clear Data", async () => {
  const { GET: getSettings, POST: postSettings } = await import(
    "../src/app/api/settings/route"
  );
  const { GET: getExport } = await import(
    "../src/app/api/settings/export/route"
  );
  const { POST: postClearData } = await import(
    "../src/app/api/settings/clear-data/route"
  );
  const { messageRepository } = await import(
    "../src/features/chat/server/message-repository"
  );

  // 1. GET Settings
  const getRes = await getSettings();
  assert.equal(getRes.status, 200);
  const { settings } = await getRes.json();
  assert.ok(settings.defaultModel);

  // 2. POST Settings update
  const postReq = new NextRequest("http://localhost:3000/api/settings", {
    method: "POST",
    body: JSON.stringify({
      theme: "dark",
      defaultModel: "gemini-2.0-flash",
      systemPrompt: "Always respond with concise markdown.",
    }),
  });
  const postRes = await postSettings(postReq);
  assert.equal(postRes.status, 200);
  const { settings: updatedSettings } = await postRes.json();
  assert.equal(updatedSettings.theme, "dark");
  assert.equal(updatedSettings.defaultModel, "gemini-2.0-flash");
  assert.equal(updatedSettings.systemPrompt, "Always respond with concise markdown.");

  // 3. Export Data
  const exportRes = await getExport();
  assert.equal(exportRes.status, 200);
  const exportData = await exportRes.json();
  assert.ok(exportData.exportedAt);
  assert.ok(Array.isArray(exportData.sessions));
  assert.ok(Array.isArray(exportData.messages));

  // 4. Clear Data
  // Create a temporary session to be wiped
  const tempSessId = `temp_wipe_${Date.now()}`;
  messageRepository.createSession({
    id: tempSessId,
    title: "To Be Wiped",
    model: "gpt-4o",
    provider: "openai",
  });
  messageRepository.saveMessage({
    id: `temp_msg_${Date.now()}`,
    sessionId: tempSessId,
    role: "user",
    content: "Temp content",
  });

  const clearReq = new NextRequest("http://localhost:3000/api/settings/clear-data", {
    method: "POST",
    body: JSON.stringify({ clearProjects: false }),
  });
  const clearRes = await postClearData(clearReq);
  assert.equal(clearRes.status, 200);
  const clearData = await clearRes.json();
  assert.equal(clearData.success, true);

  // Verify all sessions are wiped
  assert.equal(messageRepository.getSession(tempSessId), null);
  assert.equal(messageRepository.listSessions().length, 0);
});
