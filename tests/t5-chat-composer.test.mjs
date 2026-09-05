import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

test("ChatService: reasoning token extraction from <think> tags", async () => {
  const { parseReasoningAndContent } = await import(
    "../src/features/chat/server/chat-service"
  );

  // 1. Closed think tags
  const closed = parseReasoningAndContent(
    "<think>\nStep 1: Analyze problem\nStep 2: Formulate solution\n</think>\nHere is the final answer."
  );
  assert.equal(
    closed.reasoning,
    "Step 1: Analyze problem\nStep 2: Formulate solution"
  );
  assert.equal(closed.content, "Here is the final answer.");

  // 2. Unclosed think tag (in-flight streaming)
  const inFlight = parseReasoningAndContent(
    "<think>\nGenerating initial hypotheses..."
  );
  assert.equal(inFlight.reasoning, "Generating initial hypotheses...");
  assert.equal(inFlight.content, "");

  // 3. Normal text without think tag
  const normal = parseReasoningAndContent("Just a regular response.");
  assert.equal(normal.reasoning, null);
  assert.equal(normal.content, "Just a regular response.");
});

test("ChatService: tool aggregation across Search, MCP, and Plugins", async () => {
  const { chatService } = await import(
    "../src/features/chat/server/chat-service"
  );

  // Tools with search disabled
  const noSearchTools = await chatService.resolveTools({
    webSearchEnabled: false,
  });
  assert.equal(noSearchTools.webSearch, undefined);
  // Built-in plugins should be present
  assert.ok(noSearchTools.calculate);
  assert.ok(noSearchTools.read_webpage);

  // Tools with search enabled
  const withSearchTools = await chatService.resolveTools({
    webSearchEnabled: true,
    searchEngine: "duckduckgo",
  });
  assert.ok(withSearchTools.webSearch);
  assert.ok(withSearchTools.calculate);
  assert.ok(withSearchTools.read_webpage);
});

test("ChatService: prepareCoreMessages formats attachments and history", async () => {
  const { chatService } = await import(
    "../src/features/chat/server/chat-service"
  );

  const messages = chatService.prepareCoreMessages({
    sessionId: "s_test_1",
    modelId: "gpt-4o",
    prompt: "Please review this code",
    attachments: [
      {
        id: "att_1",
        name: "test.ts",
        type: "text/plain",
        size: 100,
        content: "const a = 1;",
        isImage: false,
      },
      {
        id: "att_2",
        name: "diagram.png",
        type: "image/png",
        size: 200,
        content: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
        isImage: true,
      },
    ],
  });

  assert.ok(messages.length >= 1);
  const userMsg = messages[messages.length - 1];
  assert.equal(userMsg.role, "user");

  // Content should include multimodal image parts or text attachment content
  if (Array.isArray(userMsg.content)) {
    const textPart = userMsg.content.find((p) => p.type === "text");
    const imagePart = userMsg.content.find((p) => p.type === "image");
    assert.ok(textPart);
    assert.ok(textPart.text.includes("--- Attachment: test.ts ---"));
    assert.ok(textPart.text.includes("const a = 1;"));
    assert.ok(imagePart);
    assert.equal(imagePart.image, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==");
  } else {
    assert.ok(userMsg.content.includes("const a = 1;"));
  }
});

test("MessageRepository: SQLite session and message CRUD with branching", async () => {
  const { messageRepository } = await import(
    "../src/features/chat/server/message-repository"
  );

  const testSessionId = `test_sess_${Date.now()}`;

  // 1. Create session
  const createdSession = messageRepository.createSession({
    id: testSessionId,
    title: "Test Session",
    model: "gpt-4o",
    provider: "openai",
  });
  assert.equal(createdSession.id, testSessionId);
  assert.equal(createdSession.title, "Test Session");

  // 2. Fetch session
  const fetchedSession = messageRepository.getSession(testSessionId);
  assert.ok(fetchedSession);
  assert.equal(fetchedSession.title, "Test Session");

  // 3. Save root user message
  const userMsg1 = messageRepository.saveMessage({
    id: `msg_u1_${Date.now()}`,
    sessionId: testSessionId,
    parentId: null,
    role: "user",
    content: "What is 2+2?",
    createdAt: 1000,
  });

  // 4. Save assistant response
  const asstMsg1 = messageRepository.saveMessage({
    id: `msg_a1_${Date.now()}`,
    sessionId: testSessionId,
    parentId: userMsg1.id,
    role: "assistant",
    content: "2+2 is 4.",
    reasoning: "Basic arithmetic addition.",
    citations: [{ title: "Math", url: "https://math.org" }],
    createdAt: 2000,
  });

  // 5. Save edited alternative turn (branch)
  const userMsg1Edited = messageRepository.saveMessage({
    id: `msg_u1_edit_${Date.now()}`,
    sessionId: testSessionId,
    parentId: null,
    role: "user",
    content: "What is 2+3?",
    createdAt: 3000,
  });

  const asstMsg1Edited = messageRepository.saveMessage({
    id: `msg_a1_edit_${Date.now()}`,
    sessionId: testSessionId,
    parentId: userMsg1Edited.id,
    role: "assistant",
    content: "2+3 is 5.",
    createdAt: 4000,
  });

  // 6. Verify messages retrieval
  const allMessages = messageRepository.getMessages(testSessionId);
  assert.equal(allMessages.length, 4);

  // 7. Verify linear branch from asstMsg1
  const branch1 = messageRepository.getLinearBranch(testSessionId, asstMsg1.id);
  assert.equal(branch1.length, 2);
  assert.equal(branch1[0].id, userMsg1.id);
  assert.equal(branch1[1].id, asstMsg1.id);

  // 8. Verify linear branch from asstMsg1Edited
  const branch2 = messageRepository.getLinearBranch(
    testSessionId,
    asstMsg1Edited.id
  );
  assert.equal(branch2.length, 2);
  assert.equal(branch2[0].id, userMsg1Edited.id);
  assert.equal(branch2[1].id, asstMsg1Edited.id);
});

test("Message Tree Branching Logic: sibling navigation and branch switching", () => {
  // Simulate tree navigation logic
  const mockMessages = [
    { id: "u1_v1", parentId: null, role: "user", content: "Hi", createdAt: 100 },
    { id: "a1_v1", parentId: "u1_v1", role: "assistant", content: "Hello", createdAt: 200 },
    { id: "u1_v2", parentId: null, role: "user", content: "Hey there", createdAt: 300 },
    { id: "a1_v2", parentId: "u1_v2", role: "assistant", content: "Greetings", createdAt: 400 },
    { id: "u1_v3", parentId: null, role: "user", content: "Yo", createdAt: 500 },
    { id: "a1_v3", parentId: "u1_v3", role: "assistant", content: "Sup", createdAt: 600 },
  ];

  // Sibling detection for u1 versions
  const rootSiblings = mockMessages.filter((m) => m.parentId === null && m.role === "user");
  assert.equal(rootSiblings.length, 3);

  // Current index check for v2
  const v2Idx = rootSiblings.findIndex((m) => m.id === "u1_v2");
  assert.equal(v2Idx + 1, 2); // 2 of 3

  // Navigating to prev sibling
  const prevSibling = rootSiblings[v2Idx - 1];
  assert.equal(prevSibling.id, "u1_v1");

  // Navigating to next sibling
  const nextSibling = rootSiblings[v2Idx + 1];
  assert.equal(nextSibling.id, "u1_v3");
});

test("API Routes: /api/chat and /api/chat/history input validation", async () => {
  const { POST } = await import("../src/app/api/chat/route");
  const { GET } = await import("../src/app/api/chat/history/route");

  // 1. POST /api/chat without sessionId -> 400
  const reqWithoutSession = new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "Hello" }),
  });
  const res1 = await POST(reqWithoutSession);
  assert.equal(res1.status, 400);
  const data1 = await res1.json();
  assert.ok(data1.error.includes("sessionId"));

  // 2. GET /api/chat/history without sessionId -> 400
  const reqHistoryWithoutSession = new NextRequest(
    "http://localhost:3000/api/chat/history",
    { method: "GET" }
  );
  const res2 = await GET(reqHistoryWithoutSession);
  assert.equal(res2.status, 400);

  // 3. GET /api/chat/history with sessionId -> 200
  const reqHistoryWithSession = new NextRequest(
    "http://localhost:3000/api/chat/history?sessionId=non_existent_dummy",
    { method: "GET" }
  );
  const res3 = await GET(reqHistoryWithSession);
  assert.equal(res3.status, 200);
  const data3 = await res3.json();
  assert.deepEqual(data3.messages, []);
});
