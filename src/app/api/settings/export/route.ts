import { NextResponse } from "next/server";
import { messageRepository } from "@/features/chat/server/message-repository";
import { projectRepository } from "@/features/projects/server/project-repository";
import { loadSettings } from "@/features/settings/config-file";

export const dynamic = "force-dynamic";

async function handleExport() {
  try {
    const chatData = messageRepository.exportAllData();
    const projects = projectRepository.listProjects();
    const allProjectFiles = projects.flatMap((p) => projectRepository.listProjectFiles(p.id));
    const settings = loadSettings();

    const exportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      sessions: chatData.sessions,
      messages: chatData.messages,
      projects,
      projectFiles: allProjectFiles,
      settings: {
        theme: settings.theme,
        defaultModel: settings.defaultModel,
        defaultProvider: settings.defaultProvider,
        activeSearchProvider: settings.activeSearchProvider,
      },
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="openchat-export-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("[Export API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export data" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return handleExport();
}

export async function POST() {
  return handleExport();
}
