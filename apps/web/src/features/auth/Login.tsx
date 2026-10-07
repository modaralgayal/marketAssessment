import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

/**
 * Self-service sign-in for buyers/manufacturers who already completed
 * invite-based sign-up. Unlike /signup, this does NOT require an invite: it
 * just signs the user in with Google and resolves their existing Account
 * (bootstrap is idempotent on the server). Users with no Account yet are told
 * they need an invite link.
 */
export default function Login() {
  const { user, loading, account, accountLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      navigate(account.role === "BUYER" ? "/buyer" : "/manufacturer", { replace: true });
    }
  }, [account, navigate]);

  const handleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn();
      // auth.tsx resolves the Account on user change; the effect above navigates.
    } catch {
      setError("Sign-in failed. Please try again.");
      setBusy(false);
    } finally {
      // If sign-in succeeded but there's no Account, keep the button usable so
      // the "need an invite" message stays actionable.
      setBusy(false);
    }
  };

  if (loading || (user && accountLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-brand-muted">Loading…</p>
      </div>
    );
  }
  if (account) return null; // navigating

  const signedInButNoAccount = Boolean(user) && !accountLoading && !account;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-brand-line bg-white p-10 text-center shadow-sm">
        <div className="mb-3 flex items-center justify-center">
          <img src="/logo.svg" alt="Tradelomacy" className="h-7 w-auto" />
        </div>
        <h1 className="mb-1 text-lg font-bold text-brand-ink">Sign in</h1>

        <p className="mb-6 text-sm text-brand-muted">
          {signedInButNoAccount
            ? "This Google account doesn't have a workspace yet. You need an invite link from Integrate Us to get started."
            : "Sign in to access your buyer or manufacturer workspace."}
        </p>

        <button
          onClick={handleSignIn}
          disabled={busy}
          className="w-full rounded-full bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-teal-dark hover:shadow-md active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Continue with Google"}
        </button>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
