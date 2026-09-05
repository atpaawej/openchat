import { NextRequest, NextResponse } from "next/server";
import { projectRepository } from "@/features/projects/server/project-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = projectRepository.listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("[GET /api/projects] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const project = projectRepository.createProject({
      name: body.name.trim(),
      description: body.description ?? null,
      customInstructions: body.customInstructions ?? null,
      defaultModel: body.defaultModel ?? null,
      defaultProvider: body.defaultProvider ?? null,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 500 }
    );
  }
}
