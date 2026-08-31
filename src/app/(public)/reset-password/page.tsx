import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | Cortex Partner Program",
  description: "Set a new password for your Cortex Partner Portal account.",
};

interface Props {
  searchParams: { token?: string };
}

export default function ResetPasswordPage({ searchParams }: Props) {
  const { token } = searchParams;

  if (!token) {
    redirect("/forgot-password");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Set New Password</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Choose a strong password for your account.
            </p>
          </div>
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
