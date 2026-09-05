import { eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  projects,
  projectFiles,
  sessions,
  type Project,
  type ProjectFile,
} from "@/lib/db/schema";

export class ProjectRepository {
  private get db() {
    return getDb();
  }

  listProjects(): Project[] {
    return this.db.select().from(projects).orderBy(desc(projects.createdAt)).all();
  }

  getProject(id: string): Project | null {
    const rows = this.db.select().from(projects).where(eq(projects.id, id)).all();
    return rows[0] ?? null;
  }

  createProject(data: {
    id?: string;
    name: string;
    description?: string | null;
    customInstructions?: string | null;
    defaultModel?: string | null;
    defaultProvider?: string | null;
  }): Project {
    const id = data.id || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();
    const newProject: Project = {
      id,
      name: data.name,
      description: data.description ?? null,
      customInstructions: data.customInstructions ?? null,
      defaultModel: data.defaultModel ?? null,
      defaultProvider: data.defaultProvider ?? null,
      createdAt: now,
    };

    this.db.insert(projects).values(newProject).run();
    return newProject;
  }

  updateProject(
    id: string,
    updates: Partial<{
      name: string;
      description: string | null;
      customInstructions: string | null;
      defaultModel: string | null;
      defaultProvider: string | null;
    }>
  ): Project | null {
    const existing = this.getProject(id);
    if (!existing) return null;

    this.db.update(projects).set(updates).where(eq(projects.id, id)).run();
    return this.getProject(id);
  }

  deleteProject(id: string): void {
    // Delete attached knowledge files
    this.db.delete(projectFiles).where(eq(projectFiles.projectId, id)).run();
    // Unlink sessions from this project
    this.db.update(sessions).set({ projectId: null }).where(eq(sessions.projectId, id)).run();
    // Delete the project
    this.db.delete(projects).where(eq(projects.id, id)).run();
  }

  listProjectFiles(projectId: string): ProjectFile[] {
    return this.db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId))
      .orderBy(desc(projectFiles.createdAt))
      .all();
  }

  getProjectFile(fileId: string): ProjectFile | null {
    const rows = this.db.select().from(projectFiles).where(eq(projectFiles.id, fileId)).all();
    return rows[0] ?? null;
  }

  addProjectFile(data: {
    id?: string;
    projectId: string;
    filename: string;
    content: string;
    size?: number;
  }): ProjectFile {
    const id = data.id || `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();
    const newFile: ProjectFile = {
      id,
      projectId: data.projectId,
      filename: data.filename,
      content: data.content,
      size: data.size ?? Buffer.byteLength(data.content, "utf-8"),
      createdAt: now,
    };

    this.db.insert(projectFiles).values(newFile).run();
    return newFile;
  }

  deleteProjectFile(fileId: string): void {
    this.db.delete(projectFiles).where(eq(projectFiles.id, fileId)).run();
  }

  /**
   * Generates a context prompt incorporating project custom instructions
   * and any attached knowledge files.
   */
  getProjectKnowledgePrompt(projectId: string): string {
    const project = this.getProject(projectId);
    if (!project) return "";

    const parts: string[] = [];

    if (project.customInstructions && project.customInstructions.trim().length > 0) {
      parts.push(`## Project Instructions\n${project.customInstructions.trim()}`);
    }

    const files = this.listProjectFiles(projectId);
    if (files.length > 0) {
      const fileSummaries = files
        .map((f) => `### File: ${f.filename}\n\`\`\`\n${f.content}\n\`\`\``)
        .join("\n\n");
      parts.push(`## Project Knowledge Base\n${fileSummaries}`);
    }

    return parts.join("\n\n");
  }
}

export const projectRepository = new ProjectRepository();
