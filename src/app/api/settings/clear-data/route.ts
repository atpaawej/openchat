import { NextRequest, NextResponse } from "next/server";
import { messageRepository } from "@/features/chat/server/message-repository";
import { projectRepository } from "@/features/projects/server/project-repository";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let clearProjects = false;
    try {
      const body = await request.json();
      clearProjects = Boolean(body?.clearProjects);
    } catch {
      // Body is optional
    }

    messageRepository.clearAllSessions();

    if (clearProjects) {
      const allProjects = projectRepository.listProjects();
      for (const p of allProjects) {
        projectRepository.deleteProject(p.id);
      }
    }

    return NextResponse.json({
      success: true,
      cleared: {
        chats: true,
        projects: clearProjects,
      },
    });
  } catch (error) {
    console.error("[POST /api/settings/clear-data] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to clear data" },
      { status: 500 }
    );
  }
}
