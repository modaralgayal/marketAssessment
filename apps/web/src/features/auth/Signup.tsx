import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { validateInvite } from "../../lib/api";

const ROLE_LABEL: Record<string, string> = {
  BUYER: "Buyer",
  MANUFACTURER: "Manufacturer",
};

export default function Signup() {
  const { user, signIn, bootstrap } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const invite = params.get("invite");

  const [validating, setValidating] = useState(Boolean(invite));
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invite) {
      setValidating(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await validateInvite(invite);
        if (cancelled) return;
        if (!result.valid) {
          setInviteError("This invite link is no longer valid.");
        } else if (result.purpose !== "ACCOUNT") {
          setInviteError("This invite is for the assessment form, not account sign-up.");
        } else {
          setInviteRole(result.role ?? null);
        }
      } catch {
        if (!cancelled) setInviteError("Could not verify this invite link.");
      } finally {
        if (!cancelled) setValidating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invite]);

  const handleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      // If already signed in (e.g. bounced back here), skip the popup and just
      // complete account bootstrap with the invite token.
      if (!user) await signIn();
      const account = await bootstrap(invite ?? undefined);
      navigate(account.role === "BUYER" ? "/buyer" : "/manufacturer", { replace: true });
    } catch {
      setError("Sign-in failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-brand-line bg-white p-10 text-center shadow-sm">
        <div className="mb-3 flex items-center justify-center">
          <img src="/logo.svg" alt="Tradelomacy" className="h-7 w-auto" />
        </div>
        <h1 className="mb-1 text-lg font-bold text-brand-ink">Create your account</h1>

        {validating && (
          <p className="mb-6 text-sm text-brand-muted">Checking your invite link…</p>
        )}

        {!validating && inviteError && (
          <>
            <p className="mb-6 text-sm text-red-600">{inviteError}</p>
            <a href="/" className="text-sm font-medium text-brand-teal hover:underline">
              Back to home
            </a>
          </>
        )}

        {!validating && !inviteError && (
          <>
            <p className="mb-6 text-sm text-brand-muted">
              {inviteRole
                ? `You've been invited as a ${ROLE_LABEL[inviteRole] ?? inviteRole}. Sign in to set up your ${ROLE_LABEL[inviteRole] ?? inviteRole} workspace.`
                : "Sign in to create your account and start trading."}
            </p>
            <button
              onClick={handleSignIn}
              disabled={busy}
              className="w-full rounded-full bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-teal-dark hover:shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? "Setting up…" : "Continue with Google"}
            </button>
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
