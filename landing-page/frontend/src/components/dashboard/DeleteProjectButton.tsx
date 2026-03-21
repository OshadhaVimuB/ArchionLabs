"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProject } from "@/app/dashboard/actions/deleteProject";

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

/**
 * A Client Component button to delete a project.
 * Uses the deleteProject server action.
 */
export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    // Prevent the parent <a> tag from navigating
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${projectName}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProject(projectId);
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("Failed to delete project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="absolute top-2 left-2 z-20 p-1.5 bg-white/90 dark:bg-zinc-900/90 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
      title="Delete Project"
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}
