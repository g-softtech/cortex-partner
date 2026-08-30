import LoginForm from "./LoginForm";

export const metadata = {
  title: "Login | Cortex Partner Program",
};

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-10 max-w-md w-full shadow-sm text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Partner Login</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Sign in to access your partner dashboard
        </p>
        
        <LoginForm />
      </div>
    </div>
  );
}
