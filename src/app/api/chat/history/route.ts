import { NextRequest, NextResponse } from "next/server";
import { messageRepository } from "@/features/chat/server/message-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query parameter is required" },
        { status: 400 }
      );
    }

    const session = messageRepository.getSession(sessionId);
    const messages = messageRepository.getMessages(sessionId);

    return NextResponse.json({
      session,
      messages,
    });
  } catch (error) {
    console.error("GET /api/chat/history error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
