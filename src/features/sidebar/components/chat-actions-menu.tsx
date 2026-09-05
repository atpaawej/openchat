"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/lib/ui/dropdown";
import {
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Share2,
  Check,
  AlertTriangle,
} from "lucide-react";
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
import type { SessionSummary } from "../types";

export interface ChatActionsMenuProps {
  session: SessionSummary;
  onRename: (id: string, newTitle: string) => Promise<void> | void;
  onTogglePin: (id: string, pinned: boolean) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export function ChatActionsMenu({
  session,
  onRename,
  onTogglePin,
  onDelete,
}: ChatActionsMenuProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState(session.title);
  const [copied, setCopied] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/c/${session.id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await onRename(session.id, newTitle.trim());
      setRenameOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onDelete(session.id);
      setDeleteOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Chat options"
            onClick={(e) => e.stopPropagation()}
            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-zinc-100 hover:bg-zinc-700/60 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-44 bg-zinc-900 border-zinc-800 text-zinc-200"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onClick={() => {
              onTogglePin(session.id, !session.pinned);
              setDropdownOpen(false);
            }}
            className="cursor-pointer gap-2 hover:bg-zinc-800"
          >
            {session.pinned ? (
              <>
                <PinOff className="h-4 w-4 text-zinc-400" />
                <span>Unpin chat</span>
              </>
            ) : (
              <>
                <Pin className="h-4 w-4 text-zinc-400" />
                <span>Pin chat</span>
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setNewTitle(session.title);
              setRenameOpen(true);
              setDropdownOpen(false);
            }}
            className="cursor-pointer gap-2 hover:bg-zinc-800"
          >
            <Pencil className="h-4 w-4 text-zinc-400" />
            <span>Rename</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleCopyLink}
            className="cursor-pointer gap-2 hover:bg-zinc-800"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Link copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-zinc-400" />
                <span>Share link</span>
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setDeleteOpen(true);
              setDropdownOpen(false);
            }}
            className="cursor-pointer gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/40"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter a new title for this conversation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4 pt-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Chat title"
              autoFocus
              className="bg-zinc-800 border-zinc-700 text-zinc-100 focus-visible:ring-zinc-400"
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
                className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newTitle.trim() || isSubmitting}
                className="bg-zinc-100 text-zinc-900 hover:bg-white"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Delete chat?</DialogTitle>
            </div>
            <DialogDescription className="text-zinc-400 pt-2">
              This will permanently delete <strong className="text-zinc-200">{session.title}</strong> and all of its messages. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
