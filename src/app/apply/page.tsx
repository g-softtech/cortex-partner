"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/validations/resolver";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { partnerApplicationSchema, PartnerApplicationInput } from "@/lib/validations/partner";

export default function ApplyPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartnerApplicationInput>({
    resolver: zodResolver(partnerApplicationSchema),
    defaultValues: {
      hasPotentialClients: false,
    },
  });

  const onSubmit = async (data: PartnerApplicationInput) => {
    setServerError(null);
    try {
      const response = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || "Something went wrong. Please try again.");
        return;
      }

      // Success
      router.push("/application-success");
    } catch {
      setServerError("A network error occurred. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-white border-b">
        <Link className="flex items-center justify-center" href="/">
          <span className="font-bold text-xl tracking-tighter">Cortex Partner</span>
        </Link>
      </header>

      <main className="flex-1 container px-4 md:px-6 max-w-2xl mx-auto py-12">
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Partner Application</h1>
            <p className="text-gray-500 mt-2">
              Apply to join the Cortex Partner Program. We review all applications within 48 hours.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-4 text-sm text-red-800 bg-red-100 rounded-md border border-red-200">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name *</label>
              <input
                id="name"
                type="text"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                {...register("name")}
                disabled={isSubmitting}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address *</label>
              <input
                id="email"
                type="email"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                {...register("email")}
                disabled={isSubmitting}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone Number *</label>
              <input
                id="phone"
                type="tel"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                {...register("phone")}
                disabled={isSubmitting}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            {/* Occupation */}
            <div>
              <label htmlFor="occupation" className="block text-sm font-medium text-slate-700">Current Occupation / Business *</label>
              <input
                id="occupation"
                type="text"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                {...register("occupation")}
                disabled={isSubmitting}
              />
              {errors.occupation && <p className="mt-1 text-sm text-red-600">{errors.occupation.message}</p>}
            </div>

            {/* Potential Clients */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Do you currently have potential clients in mind? *</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="true"
                    className="mr-2"
                    {...register("hasPotentialClients", {
                      setValueAs: (v) => v === "true"
                    })}
                    disabled={isSubmitting}
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="false"
                    defaultChecked
                    className="mr-2"
                    {...register("hasPotentialClients", {
                      setValueAs: (v) => v === "true"
                    })}
                    disabled={isSubmitting}
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
              {errors.hasPotentialClients && <p className="mt-1 text-sm text-red-600">{errors.hasPotentialClients.message}</p>}
            </div>

            {/* Potential Client Type (Optional) */}
            <div>
              <label htmlFor="potentialClientType" className="block text-sm font-medium text-slate-700">What type of clients? (Optional)</label>
              <input
                id="potentialClientType"
                type="text"
                placeholder="e.g. Local restaurants, Ecommerce stores"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                {...register("potentialClientType")}
                disabled={isSubmitting}
              />
              {errors.potentialClientType && <p className="mt-1 text-sm text-red-600">{errors.potentialClientType.message}</p>}
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-slate-700">Why do you want to join the Partner Program? *</label>
              <textarea
                id="reason"
                rows={4}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                {...register("reason")}
                disabled={isSubmitting}
              />
              {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>}
            </div>

            {/* Source */}
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-slate-700">How did you hear about us? (Optional)</label>
              <input
                id="source"
                type="text"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                {...register("source")}
                disabled={isSubmitting}
              />
              {errors.source && <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>}
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-900/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
