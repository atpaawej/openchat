import { NextRequest, NextResponse } from "next/server";
import { projectRepository } from "@/features/projects/server/project-repository";
import { messageRepository } from "@/features/chat/server/message-repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = projectRepository.getProject(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const files = projectRepository.listProjectFiles(id);
    const sessions = messageRepository.listSessions(id);

    return NextResponse.json({
      project,
      files,
      sessions,
    });
  } catch (error) {
    console.error("[GET /api/projects/[id]] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch project" },
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
    const existing = projectRepository.getProject(id);
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: any = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description;
    if (body.customInstructions !== undefined) updates.customInstructions = body.customInstructions;
    if (body.defaultModel !== undefined) updates.defaultModel = body.defaultModel;
    if (body.defaultProvider !== undefined) updates.defaultProvider = body.defaultProvider;

    const updated = projectRepository.updateProject(id, updates);
    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("[PATCH /api/projects/[id]] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update project" },
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
    const existing = projectRepository.getProject(id);
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    projectRepository.deleteProject(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[DELETE /api/projects/[id]] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete project" },
      { status: 500 }
    );
  }
}
