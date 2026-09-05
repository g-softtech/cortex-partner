"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileEditFormProps {
  currentName: string;
}

export function ProfileEditForm({ currentName }: ProfileEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || name.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/partners/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile.");
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <dd className="mt-1 flex items-center justify-between text-slate-900 dark:text-slate-100">
        <span>{currentName || "—"}</span>
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Edit
        </button>
      </dd>
    );
  }

  return (
    <dd className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSaving}
          className="block w-full max-w-sm rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
          placeholder="Your full name"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setName(currentName);
            setError(null);
          }}
          disabled={isSaving}
          className="rounded-md bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </dd>
  );
}
