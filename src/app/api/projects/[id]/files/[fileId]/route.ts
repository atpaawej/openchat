import { NextRequest, NextResponse } from "next/server";
import { projectRepository } from "@/features/projects/server/project-repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const file = projectRepository.getProjectFile(fileId);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error("[GET /api/projects/[id]/files/[fileId]] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const file = projectRepository.getProjectFile(fileId);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    projectRepository.deleteProjectFile(fileId);
    return NextResponse.json({ success: true, fileId });
  } catch (error) {
    console.error("[DELETE /api/projects/[id]/files/[fileId]] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete file" },
      { status: 500 }
    );
  }
}
