import { eq, desc, asc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { sessions, messages, type Session, type Message } from "@/lib/db/schema";
import type { ChatMessage, MessageRole } from "../types";

export class MessageRepository {
  private get db() {
    return getDb();
  }

  getSession(sessionId: string): Session | null {
    const rows = this.db.select().from(sessions).where(eq(sessions.id, sessionId)).all();
    return rows[0] ?? null;
  }

  createSession(data: {
    id: string;
    title: string;
    model: string;
    provider: string;
    projectId?: string | null;
    pinned?: boolean;
  }): Session {
    const now = new Date();
    const newSession = {
      id: data.id,
      title: data.title,
      model: data.model,
      provider: data.provider,
      projectId: data.projectId ?? null,
      pinned: data.pinned ?? false,
      createdAt: now,
      updatedAt: now,
    };

    this.db.insert(sessions).values(newSession).run();
    return newSession;
  }

  updateSession(
    sessionId: string,
    updates: Partial<{
      title: string;
      model: string;
      provider: string;
      projectId: string | null;
      pinned: boolean;
      updatedAt: Date;
    }>
  ): void {
    const dataToUpdate = {
      ...updates,
      updatedAt: updates.updatedAt ?? new Date(),
    };
    this.db.update(sessions).set(dataToUpdate).where(eq(sessions.id, sessionId)).run();
  }

  listSessions(projectId?: string | null): Session[] {
    let query = this.db.select().from(sessions);
    if (projectId !== undefined) {
      if (projectId === null) {
        query = query.where(eq(sessions.projectId, null as any)) as any;
      } else {
        query = query.where(eq(sessions.projectId, projectId)) as any;
      }
    }
    return query.orderBy(desc(sessions.pinned), desc(sessions.updatedAt)).all();
  }

  deleteSession(sessionId: string): void {
    // Delete messages first
    this.db.delete(messages).where(eq(messages.sessionId, sessionId)).run();
    // Then delete session
    this.db.delete(sessions).where(eq(sessions.id, sessionId)).run();
  }

  clearAllSessions(): void {
    this.db.delete(messages).run();
    this.db.delete(sessions).run();
  }

  exportAllData() {
    const allSessions = this.db.select().from(sessions).all();
    const allMessages = this.db.select().from(messages).all();
    return {
      sessions: allSessions,
      messages: allMessages,
      exportedAt: new Date().toISOString(),
    };
  }

  getMessages(sessionId: string): ChatMessage[] {
    const rows = this.db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt))
      .all();

    return rows.map((row) => ({
      id: row.id,
      sessionId: row.sessionId,
      parentId: row.parentId,
      role: row.role as MessageRole,
      content: row.content,
      reasoning: row.reasoning,
      toolCalls: row.toolCalls ? this.safeJsonParse(row.toolCalls) : null,
      citations: row.citations ? this.safeJsonParse(row.citations) : null,
      createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Number(row.createdAt),
    }));
  }

  getMessage(id: string): ChatMessage | null {
    const rows = this.db.select().from(messages).where(eq(messages.id, id)).all();
    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      sessionId: row.sessionId,
      parentId: row.parentId,
      role: row.role as MessageRole,
      content: row.content,
      reasoning: row.reasoning,
      toolCalls: row.toolCalls ? this.safeJsonParse(row.toolCalls) : null,
      citations: row.citations ? this.safeJsonParse(row.citations) : null,
      createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Number(row.createdAt),
    };
  }

  saveMessage(msg: {
    id: string;
    sessionId: string;
    parentId?: string | null;
    role: MessageRole;
    content: string;
    reasoning?: string | null;
    toolCalls?: any;
    citations?: any;
    createdAt?: Date | number;
  }): ChatMessage {
    const createdAtDate =
      typeof msg.createdAt === "number"
        ? new Date(msg.createdAt)
        : msg.createdAt ?? new Date();

    const toolCallsString =
      msg.toolCalls && typeof msg.toolCalls === "object"
        ? JSON.stringify(msg.toolCalls)
        : msg.toolCalls ?? null;

    const citationsString =
      msg.citations && typeof msg.citations === "object"
        ? JSON.stringify(msg.citations)
        : msg.citations ?? null;

    // Check if message already exists
    const existing = this.getMessage(msg.id);
    if (existing) {
      this.db
        .update(messages)
        .set({
          content: msg.content,
          reasoning: msg.reasoning ?? null,
          toolCalls: toolCallsString,
          citations: citationsString,
        })
        .where(eq(messages.id, msg.id))
        .run();
    } else {
      this.db
        .insert(messages)
        .values({
          id: msg.id,
          sessionId: msg.sessionId,
          parentId: msg.parentId ?? null,
          role: msg.role,
          content: msg.content,
          reasoning: msg.reasoning ?? null,
          toolCalls: toolCallsString,
          citations: citationsString,
          createdAt: createdAtDate,
        })
        .run();
    }

    return {
      id: msg.id,
      sessionId: msg.sessionId,
      parentId: msg.parentId ?? null,
      role: msg.role,
      content: msg.content,
      reasoning: msg.reasoning ?? null,
      toolCalls: msg.toolCalls,
      citations: msg.citations,
      createdAt: createdAtDate.getTime(),
    };
  }

  deleteMessage(id: string): void {
    this.db.delete(messages).where(eq(messages.id, id)).run();
  }

  /**
   * Reconstructs a linear message sequence from root to the given leaf message.
   * If leafId is not provided, uses the most recent message in the session.
   */
  getLinearBranch(sessionId: string, leafId?: string | null): ChatMessage[] {
    const allMessages = this.getMessages(sessionId);
    if (allMessages.length === 0) return [];

    const map = new Map<string, ChatMessage>();
    for (const msg of allMessages) {
      map.set(msg.id, msg);
    }

    let targetId = leafId;
    if (!targetId) {
      // Pick the latest message
      targetId = allMessages[allMessages.length - 1]!.id;
    }

    const branch: ChatMessage[] = [];
    let curr: ChatMessage | undefined = map.get(targetId);

    while (curr) {
      branch.unshift(curr);
      curr = curr.parentId ? map.get(curr.parentId) : undefined;
    }

    return branch;
  }

  private safeJsonParse(val: string): any {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
}

export const messageRepository = new MessageRepository();
