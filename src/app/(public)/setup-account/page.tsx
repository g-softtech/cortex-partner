import SetupForm from "./SetupForm";

export const metadata = {
  title: "Setup Account | Cortex Partner Program",
};

interface PageProps {
  searchParams: { token?: string };
}

export default function SetupAccountPage({ searchParams }: PageProps) {
  const token = searchParams.token;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-800 border rounded-lg p-10 max-w-md w-full shadow-sm text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Set up your account</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Choose a secure password to activate your partner account.
        </p>

        {!token ? (
          <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
            No setup token provided. Please use the link sent to your email.
          </div>
        ) : (
          <SetupForm token={token} />
        )}
      </div>
    </div>
  );
}
