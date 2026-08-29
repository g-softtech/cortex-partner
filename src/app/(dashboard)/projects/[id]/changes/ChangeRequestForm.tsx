"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/validations/resolver";
import { changeRequestSchema, ChangeRequestInput } from "@/lib/validations/changes";

export function ChangeRequestForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangeRequestInput>({
    resolver: zodResolver(changeRequestSchema),
  });

  const onSubmit = async (data: ChangeRequestInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Submission failed.");
      
      reset();
      router.refresh();
      // Redirect to the detail page to allow file uploads
      router.push(`/projects/${projectId}/changes/${responseData.changeRequest.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          Description of requested changes
        </label>
        <p className="mb-2 text-xs text-slate-500">Please provide as much detail as possible.</p>
        <textarea
          {...register("description")}
          id="description"
          rows={6}
          className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="E.g., We need to update the hero image and change the headline text to..."
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Request & Add Files"}
        </button>
      </div>
    </form>
  );
}
