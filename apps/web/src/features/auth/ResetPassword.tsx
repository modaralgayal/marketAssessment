import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth, authErrorMessage } from "../../lib/auth";
import { PasswordInput } from "../../components/ui/PasswordInput";

/**
 * Completes a password reset. The reset email links here with an `oobCode`
 * (Firebase's one-time action code). We verify it, let the user set a new
 * password, then send them to sign in. This is the missing half of the
 * "Forgot password" flow — previously the emailed link landed on /login and
 * could not actually reset anything.
 */
export default function ResetPassword() {
  const { verifyResetCode, confirmResetPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const oobCode = params.get("oobCode") ?? "";

  const [email, setEmail] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Verify the action code as soon as the page loads.
  useEffect(() => {
    if (!oobCode) {
      setCodeError("This reset link is missing its code. Please request a new one.");
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const userEmail = await verifyResetCode(oobCode);
        if (!cancelled) setEmail(userEmail);
      } catch (err) {
        if (!cancelled) setCodeError(authErrorMessage(err));
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [oobCode, verifyResetCode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await confirmResetPassword(oobCode, password);
      setDone(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="w-full max-w-sm rounded-lg border border-brand-line bg-white p-10 text-center shadow-sm">
        <div className="mb-3 flex items-center justify-center">
          <img src="/logo.svg" alt="Tradelomacy" className="h-7 w-auto" />
        </div>
        <h1 className="mb-1 text-lg font-bold text-brand-ink">Reset your password</h1>

        {checking && <p className="mb-6 text-sm text-brand-muted">Checking your reset link…</p>}

        {!checking && codeError && (
          <>
            <p className="mb-6 text-sm text-red-600">{codeError}</p>
            <Link
              to="/login"
              className="text-sm font-medium text-brand-teal hover:underline"
            >
              Back to sign in
            </Link>
          </>
        )}

        {!checking && !codeError && done && (
          <>
            <p className="mb-6 text-sm text-brand-muted">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="w-full rounded-full bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-teal-dark"
            >
              Continue to sign in
            </button>
          </>
        )}

        {!checking && !codeError && !done && (
          <>
            <p className="mb-6 text-sm text-brand-muted">
              {email ? `Choose a new password for ${email}.` : "Choose a new password for your account."}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3 text-left">
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                required
                minLength={6}
                autoComplete="new-password"
                label="New password"
              />
              <PasswordInput
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                autoComplete="new-password"
                label="Confirm new password"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-50"
              >
                {busy ? "Updating…" : "Update password"}
              </button>
              {error && <p className="text-xs text-red-600">{error}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
