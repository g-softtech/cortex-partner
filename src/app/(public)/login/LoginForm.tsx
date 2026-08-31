"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

type LoginValues = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>();

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError("Invalid email or password.");
      } else {
        const session = await getSession();
        // Honour the callbackUrl if present (e.g. admin clicked an email link while logged out)
        const callbackUrl = searchParams.get("callbackUrl");
        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (session?.user?.role === "ADMIN") {
          router.push("/admin/partner-applications");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground text-left">
          Email
        </label>
        <input
          {...register("email", { required: "Please enter a valid email address." })}
          type="email"
          autoComplete="email"
          disabled={isLoading}
          className="w-full px-3 py-2 bg-background text-foreground border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-gold transition-colors"
        />
        {errors.email && (
          <p className="text-sm text-red-600 text-left">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground text-left">
          Password
        </label>
        <div className="relative">
          <input
            {...register("password", { required: "Password is required." })}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            disabled={isLoading}
            className="w-full px-3 py-2 bg-background text-foreground border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-gold transition-colors pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-brand-gold transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600 text-left">{errors.password.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-brand-gold hover:underline transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-brand-gold text-brand-navy font-bold rounded-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold disabled:opacity-50 transition-colors"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
