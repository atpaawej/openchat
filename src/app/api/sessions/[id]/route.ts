import { NextRequest, NextResponse } from "next/server";
import { messageRepository } from "@/features/chat/server/message-repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = messageRepository.getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const messages = messageRepository.getMessages(id);

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        projectId: session.projectId,
        model: session.model,
        provider: session.provider,
        pinned: Boolean(session.pinned),
        createdAt: session.createdAt instanceof Date ? session.createdAt.getTime() : Number(session.createdAt),
        updatedAt: session.updatedAt instanceof Date ? session.updatedAt.getTime() : Number(session.updatedAt),
      },
      messages,
    });
  } catch (error) {
    console.error("[GET /api/sessions/[id]] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = messageRepository.getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Partial<{
      title: string;
      pinned: boolean;
      projectId: string | null;
      model: string;
      provider: string;
    }> = {};

    if (typeof body.title === "string") {
      updates.title = body.title.trim();
    }
    if (typeof body.pinned === "boolean") {
      updates.pinned = body.pinned;
    }
    if (body.projectId !== undefined) {
      updates.projectId = body.projectId ? String(body.projectId) : null;
    }
    if (typeof body.model === "string") {
      updates.model = body.model;
    }
    if (typeof body.provider === "string") {
      updates.provider = body.provider;
    }

    messageRepository.updateSession(id, updates);
    const updated = messageRepository.getSession(id);

    return NextResponse.json({
      session: updated
        ? {
            id: updated.id,
            title: updated.title,
            projectId: updated.projectId,
            model: updated.model,
            provider: updated.provider,
            pinned: Boolean(updated.pinned),
            createdAt: updated.createdAt instanceof Date ? updated.createdAt.getTime() : Number(updated.createdAt),
            updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.getTime() : Number(updated.updatedAt),
          }
        : null,
    });
  } catch (error) {
    console.error("[PATCH /api/sessions/[id]] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = messageRepository.getSession(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    messageRepository.deleteSession(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[DELETE /api/sessions/[id]] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete session" },
      { status: 500 }
    );
  }
}
