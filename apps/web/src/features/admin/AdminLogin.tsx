import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

export default function AdminLogin() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate("/admin", { replace: true });
  }, [user, loading, navigate]);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signIn();
    } catch {
      setError("Sign-in failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg bg-white p-10 text-center shadow-sm">
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-orange" />
          <span className="text-xs font-bold uppercase tracking-[3px] text-dark-blue">Integrate Us Oy</span>
        </div>
        <h1 className="mb-1 text-lg font-bold text-dark-blue">Admin Dashboard</h1>
        <p className="mb-6 text-sm text-gray-500">Sign in to view assessment submissions.</p>
        <button
          onClick={handleSignIn}
          className="w-full rounded bg-mid-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-dark-blue"
        >
          Sign in with Google
        </button>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
