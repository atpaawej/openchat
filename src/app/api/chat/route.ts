import { NextRequest, NextResponse } from "next/server";
import { chatService } from "@/features/chat/server/chat-service";
import type { ChatTurnRequest } from "@/features/chat/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatTurnRequest;

    if (!body.sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const response = await chatService.streamChat(body);
    return response;
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
