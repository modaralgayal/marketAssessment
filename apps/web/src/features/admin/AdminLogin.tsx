import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

export default function AdminLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn();
      navigate("/admin", { replace: true });
    } catch {
      setError("Sign-in failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-brand-line bg-white p-10 text-center shadow-sm">
        <div className="mb-2 flex items-center justify-center gap-2">
          <img src="/logo.svg" alt="Tradelomacy" className="h-7 w-auto" />
        </div>
        <h1 className="mb-1 text-lg font-bold text-brand-ink">Admin Dashboard</h1>
        <p className="mb-6 text-sm text-brand-muted">Sign in to view assessment submissions.</p>
        <button
          onClick={handleSignIn}
          className="w-full rounded-full bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-teal-dark hover:shadow-md active:scale-[0.98]"
        >
          Sign in with Google
        </button>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
