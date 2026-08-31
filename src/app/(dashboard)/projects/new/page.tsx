"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/validations/resolver";
import { projectSubmissionSchema, ProjectSubmissionInput } from "@/lib/validations/project";
import Link from "next/link";
import { ProjectType } from "@prisma/client";

const PROJECT_TYPE_OPTIONS: { label: string; value: ProjectType }[] = [
  { label: "Website", value: "WEBSITE" },
  { label: "E-Commerce", value: "ECOMMERCE" },
  { label: "Web Application", value: "WEB_APP" },
  { label: "Custom Software", value: "CUSTOM_SOFTWARE" },
  { label: "Mobile App", value: "MOBILE_APP" },
  { label: "SaaS", value: "SAAS" },
  { label: "Business Management", value: "BUSINESS_MANAGEMENT" },
  { label: "Automation", value: "AUTOMATION" },
  { label: "Other", value: "OTHER" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectSubmissionInput>({
    resolver: zodResolver(projectSubmissionSchema),
    defaultValues: {
      budget: "",
      timeline: "",
    },
  });

  const onSubmit = async (data: ProjectSubmissionInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to submit project");
      }

      // Successful submission
      // Redirect to the newly created project detail page using the returned safe ID
      router.push(`/projects/${responseData.projectId}`);
      router.refresh(); // Refresh to update the dashboard stats
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/projects" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300">
          ← Back to Projects
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Submit New Project</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tell us about the project requirements, and we will provide an estimate.
        </p>
      </div>

      <div className="rounded-lg border bg-white dark:bg-slate-800 p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="projectType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Project Type <span className="text-red-500">*</span>
            </label>
            <select
              id="projectType"
              {...register("projectType")}
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50 dark:bg-slate-900/50"
              disabled={isSubmitting}
            >
              <option value="">Select a type...</option>
              {PROJECT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.projectType && (
              <p className="mt-1 text-sm text-red-600">{errors.projectType.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Project Description <span className="text-red-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Provide a high-level overview of what the client wants to achieve.
            </p>
            <textarea
              id="description"
              rows={4}
              {...register("description")}
              className="block w-full rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50 dark:bg-slate-900/50"
              placeholder="The client needs a new e-commerce store to sell their artisan coffee..."
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="features" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Requested Features <span className="text-red-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              List the specific features or pages required (e.g., user login, payment gateway, custom booking form).
            </p>
            <textarea
              id="features"
              rows={4}
              {...register("features")}
              className="block w-full rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50 dark:bg-slate-900/50"
              placeholder="- User authentication&#10;- Stripe payment integration&#10;- Custom dashboard for store owners"
              disabled={isSubmitting}
            />
            {errors.features && (
              <p className="mt-1 text-sm text-red-600">{errors.features.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Budget Expectations (Optional)
              </label>
              <input
                id="budget"
                type="text"
                {...register("budget")}
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50 dark:bg-slate-900/50"
                placeholder="e.g. £5,000 - £10,000"
                disabled={isSubmitting}
              />
              {errors.budget && (
                <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="timeline" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Desired Timeline (Optional)
              </label>
              <input
                id="timeline"
                type="text"
                {...register("timeline")}
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50 dark:bg-slate-900/50"
                placeholder="e.g. End of Q3, or 2 months"
                disabled={isSubmitting}
              />
              {errors.timeline && (
                <p className="mt-1 text-sm text-red-600">{errors.timeline.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 sm:w-auto sm:px-8"
            >
              {isSubmitting ? "Submitting..." : "Submit Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
