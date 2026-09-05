"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/lib/ui/dialog";
import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Textarea } from "@/lib/ui/textarea";
import { Folder, Loader2 } from "lucide-react";
import type { Project, CreateProjectInput, UpdateProjectInput } from "../types";

export interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onProjectSaved?: (project: Project) => void;
}

export function ProjectModal({
  open,
  onOpenChange,
  project,
  onProjectSaved,
}: ProjectModalProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [customInstructions, setCustomInstructions] = React.useState("");
  const [defaultModel, setDefaultModel] = React.useState("gpt-4o");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setCustomInstructions(project.customInstructions || "");
      setDefaultModel(project.defaultModel || "gpt-4o");
    } else {
      setName("");
      setDescription("");
      setCustomInstructions("");
      setDefaultModel("gpt-4o");
    }
    setError(null);
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (project) {
        // Edit mode
        const res = await fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            customInstructions: customInstructions.trim() || null,
            defaultModel: defaultModel.trim() || null,
          } as UpdateProjectInput),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to update project");
        }

        const data = await res.json();
        onProjectSaved?.(data.project);
      } else {
        // Create mode
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
            customInstructions: customInstructions.trim() || undefined,
            defaultModel: defaultModel.trim() || undefined,
          } as CreateProjectInput),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to create project");
        }

        const data = await res.json();
        onProjectSaved?.(data.project);
      }

      // Notify sidebar to refresh
      window.dispatchEvent(new CustomEvent("openchat-refresh-sidebar"));
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Folder className="h-4 w-4" />
            </div>
            <DialogTitle>
              {project ? "Edit Project" : "Create New Project"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            Projects allow you to group chats, set custom system instructions, and upload knowledge documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg bg-red-950/50 border border-red-800/80 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Project Name <span className="text-red-400">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Next.js Architecture, Market Research"
              autoFocus
              className="bg-zinc-800/90 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Description <span className="text-zinc-500 text-[11px]">(Optional)</span>
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this project's purpose"
              className="bg-zinc-800/90 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Custom Instructions <span className="text-zinc-500 text-[11px]">(Injected into all project chats)</span>
            </label>
            <Textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="What instructions or persona should the AI follow in this project? (e.g. Code standards, tone, domain context)"
              rows={4}
              className="bg-zinc-800/90 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Default Model
            </label>
            <Input
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              placeholder="gpt-4o, claude-3-5-sonnet-latest, etc."
              className="bg-zinc-800/90 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="bg-zinc-100 text-zinc-900 hover:bg-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : project ? (
                "Save Changes"
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
