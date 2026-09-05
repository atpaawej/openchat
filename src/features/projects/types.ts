import type { Project, ProjectFile, Session } from "@/lib/db/schema";

export type { Project, ProjectFile };

export interface ProjectDetail extends Project {
  files: ProjectFile[];
  sessions: Session[];
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  customInstructions?: string;
  defaultModel?: string;
  defaultProvider?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  customInstructions?: string | null;
  defaultModel?: string | null;
  defaultProvider?: string | null;
}
