import { NextRequest, NextResponse } from "next/server";
import { messageRepository } from "@/features/chat/server/message-repository";
import { groupSessionsByBucket, type SessionSummary } from "@/features/sidebar/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const rawSessions = messageRepository.listSessions(projectId ?? undefined);

    const summaries: SessionSummary[] = rawSessions.map((s) => ({
      id: s.id,
      title: s.title,
      projectId: s.projectId,
      model: s.model,
      provider: s.provider,
      pinned: Boolean(s.pinned),
      createdAt: s.createdAt instanceof Date ? s.createdAt.getTime() : Number(s.createdAt),
      updatedAt: s.updatedAt instanceof Date ? s.updatedAt.getTime() : Number(s.updatedAt),
    }));

    const grouped = groupSessionsByBucket(summaries);

    return NextResponse.json({
      sessions: summaries,
      grouped,
    });
  } catch (error) {
    console.error("[GET /api/sessions] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
