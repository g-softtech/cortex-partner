"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

type SetupValues = {
  password: string;
  confirmPassword: string;
};

interface SetupFormProps {
  token: string;
}

export default function SetupForm({ token }: SetupFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<SetupValues>();

  const onSubmit = async (data: SetupValues) => {
    if (data.password !== data.confirmPassword) {
      setFormError("confirmPassword", { message: "Passwords do not match." });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/setup-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "An error occurred during account setup.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
          Your password has been successfully set.
        </div>
        <button
          onClick={() => router.push("/login")}
          className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          Proceed to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700 text-left">
          New Password
        </label>
        <div className="relative">
          <input
            {...register("password", { 
              required: "Password is required.", 
              minLength: { value: 8, message: "Password must be at least 8 characters long." }
            })}
            type={showPassword ? "text" : "password"}
            disabled={isLoading}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 border-slate-300 pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600 text-left">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700 text-left">
          Confirm Password
        </label>
        <div className="relative">
          <input
            {...register("confirmPassword", { required: "Please confirm your password." })}
            type={showConfirmPassword ? "text" : "password"}
            disabled={isLoading}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 border-slate-300 pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 text-left">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition-colors"
      >
        {isLoading ? "Saving..." : "Set Password"}
      </button>
    </form>
  );
}
