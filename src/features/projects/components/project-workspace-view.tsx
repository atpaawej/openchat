"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Folder,
  Plus,
  Pencil,
  Trash2,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { ChatShell } from "@/features/chat/components/chat-shell";
import { KnowledgeUploader } from "./knowledge-uploader";
import { ProjectModal } from "./project-modal";
import { Button } from "@/lib/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/lib/ui/dialog";
import type { Project, ProjectFile } from "../types";
import type { Session } from "@/lib/db/schema";

export interface ProjectWorkspaceViewProps {
  initialProject: Project;
  initialFiles: ProjectFile[];
  initialSessions: Session[];
  defaultModel?: string;
  defaultProvider?: string;
}

export function ProjectWorkspaceView({
  initialProject,
  initialFiles,
  initialSessions,
  defaultModel = "gpt-4o",
  defaultProvider = "openai",
}: ProjectWorkspaceViewProps) {
  const router = useRouter();
  const [project, setProject] = React.useState<Project>(initialProject);
  const [files, setFiles] = React.useState<ProjectFile[]>(initialFiles);
  const [sessions, setSessions] = React.useState<Session[]>(initialSessions);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const refreshProjectData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setFiles(data.files || []);
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to refresh project data:", err);
    }
  }, [project.id]);

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("openchat-refresh-sidebar"));
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartProjectChat = () => {
    // Generate fresh session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    // Route to chat with project query param
    router.push(`/c/${newSessionId}?project=${project.id}`);
  };

  return (
    <ChatShell
      threadTitle={project.name}
      selectedModelId={project.defaultModel || defaultModel}
      selectedProviderId={project.defaultProvider || defaultProvider}
      projectId={project.id}
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Project Header Banner */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner">
                <Folder className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {project.name}
                  </h1>
                  {project.defaultModel && (
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                      {project.defaultModel}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  {project.description || "No project description provided."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="text-xs border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="text-xs border-zinc-300 dark:border-zinc-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleStartProjectChat}
                className="text-xs bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Chat</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Instructions & Knowledge */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Custom Instructions */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Custom Instructions
              </h2>
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="text-xs text-amber-500 hover:text-amber-400 font-medium"
              >
                Edit
              </button>
            </div>
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/60 p-4 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed min-h-[120px]">
              {project.customInstructions || (
                <span className="text-zinc-400 italic">
                  No custom instructions set. The AI will respond with standard defaults. Click Edit to add project guidelines.
                </span>
              )}
            </div>
          </div>

          {/* Knowledge Documents */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Project Knowledge Files
            </h2>
            <KnowledgeUploader
              projectId={project.id}
              files={files}
              onFilesChanged={refreshProjectData}
            />
          </div>
        </div>

        {/* Project Chats Section */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Project Chats ({sessions.length})
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStartProjectChat}
              className="text-xs border-zinc-300 dark:border-zinc-700 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Start Chat</span>
            </Button>
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-xs text-zinc-500">
              No conversations in this project yet. Start a new chat to begin working with your project knowledge!
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
              {sessions.map((sess) => (
                <Link
                  key={sess.id}
                  href={`/c/${sess.id}`}
                  className="flex items-center justify-between p-3 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <MessageSquare className="h-4 w-4 text-zinc-400 shrink-0" />
                    <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                      {sess.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-zinc-400 text-[11px]">
                    <span>{sess.model}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      <ProjectModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        project={project}
        onProjectSaved={(updated) => {
          setProject(updated);
          refreshProjectData();
        }}
      />

      {/* Delete Project Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Delete project?</DialogTitle>
            </div>
            <DialogDescription className="text-zinc-400 pt-2">
              Are you sure you want to delete <strong className="text-zinc-200">{project.name}</strong>? Its attached knowledge documents will be removed. Chats will remain accessible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChatShell>
  );
}
