"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
    >
      {isLoading ? "Signing out..." : "Sign Out"}
    </button>
  );
}
