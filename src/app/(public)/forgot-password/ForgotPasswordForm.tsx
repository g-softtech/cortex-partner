"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";

type FormValues = { email: string };

export default function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      // Always show the success message regardless of response
      // (prevents user enumeration — we don't tell them if the email exists)
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
          <p className="font-medium">Check your email</p>
          <p className="mt-1">
            If an account exists for that email, we&apos;ve sent a password reset link. It expires in 1 hour.
          </p>
        </div>
        <Link
          href="/login"
          className="block w-full text-center py-2.5 px-4 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isLoading}
          {...register("email", {
            required: "Email is required.",
            pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." },
          })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 border-slate-300 dark:border-slate-700 disabled:opacity-50"
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition-colors font-medium"
      >
        {isLoading ? "Sending..." : "Send Reset Link"}
      </button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-slate-900 dark:text-slate-100 hover:underline">
          Back to Login
        </Link>
      </p>
    </form>
  );
}
