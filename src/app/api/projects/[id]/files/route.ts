import { NextRequest, NextResponse } from "next/server";
import { projectRepository } from "@/features/projects/server/project-repository";

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
    return NextResponse.json({ files });
  } catch (error) {
    console.error("[GET /api/projects/[id]/files] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list project files" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const project = projectRepository.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const uploadedFiles = formData.getAll("file");
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return NextResponse.json({ error: "No files provided in form data" }, { status: 400 });
      }

      const createdFiles = [];
      for (const item of uploadedFiles) {
        if (typeof item === "object" && "name" in item) {
          const file = item as File;
          const text = await file.text();
          const saved = projectRepository.addProjectFile({
            projectId,
            filename: file.name,
            content: text,
            size: file.size,
          });
          createdFiles.push(saved);
        }
      }

      return NextResponse.json({ files: createdFiles }, { status: 201 });
    }

    // Otherwise expect JSON body
    const body = await request.json();
    if (!body.filename || typeof body.filename !== "string") {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }
    if (typeof body.content !== "string") {
      return NextResponse.json({ error: "content is required and must be a string" }, { status: 400 });
    }

    const saved = projectRepository.addProjectFile({
      projectId,
      filename: body.filename.trim(),
      content: body.content,
      size: body.size ?? Buffer.byteLength(body.content, "utf-8"),
    });

    return NextResponse.json({ file: saved }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects/[id]/files] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    );
  }
}
