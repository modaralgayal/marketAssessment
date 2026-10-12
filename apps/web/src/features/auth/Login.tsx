import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { requestAccess } from "../../lib/api";

/**
 * Self-service sign-in for buyers/manufacturers who already completed
 * invite-based sign-up. Unlike /signup, this does NOT require an invite: it
 * just signs the user in with Google and resolves their existing Account
 * (bootstrap is idempotent on the server). Users with no Account yet are told
 * they need an invite link — and can request one right here.
 */
export default function Login() {
  const { user, loading, account, accountLoading, signIn, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email / password fields.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

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
      setBusy(false);
    }
  };

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailBusy(true);
    try {
      await signInWithEmail(email, password);
      // The account effect above resolves the Account and navigates.
    } catch (err) {
      setEmailError(
        err instanceof Error && err.message
          ? err.message
          : "Sign-in failed. Check your email and password.",
      );
      setEmailBusy(false);
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
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

        <div className="my-5 flex items-center gap-3 text-xs text-brand-muted">
          <span className="h-px flex-1 bg-brand-line" />
          or
          <span className="h-px flex-1 bg-brand-line" />
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Work email"
            required
            autoComplete="email"
            className="w-full rounded border border-brand-line px-3 py-2.5 text-sm outline-none focus:border-brand-teal"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
            className="w-full rounded border border-brand-line px-3 py-2.5 text-sm outline-none focus:border-brand-teal"
          />
          <button
            type="submit"
            disabled={emailBusy}
            className="w-full rounded-full bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-50"
          >
            {emailBusy ? "Signing in…" : "Sign in"}
          </button>
          {emailError && <p className="text-xs text-red-600">{emailError}</p>}
        </form>
      </div>

      <RequestAccessCard />
    </div>
  );
}

/**
 * The "Has User? NO → Request a user creation" branch of the onboarding flow.
 * A visitor (signed out or signed in without a workspace) submits this form;
 * an admin reviews it at /admin/access-requests and, on approval, emails an
 * invite link that the visitor uses to create their profile.
 */
function RequestAccessCard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [intendedRole, setIntendedRole] = useState<"BUYER" | "MANUFACTURER">("BUYER");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      await requestAccess({ name, email, company: company || undefined, intendedRole, message: message || undefined });
      setDone(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed to submit your request");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="w-full max-w-sm rounded-lg border border-brand-teal/30 bg-brand-teal/5 p-8 text-center shadow-sm">
        <h2 className="mb-1 text-base font-bold text-brand-ink">Request received</h2>
        <p className="text-sm text-brand-muted">
          Thanks, {name || "we'll review your request"}. If approved, we'll email an invite link to{" "}
          <span className="font-semibold text-brand-ink">{email}</span> so you can create your
          workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-brand-line bg-white p-8 text-center shadow-sm">
      <h2 className="mb-1 text-base font-bold text-brand-ink">Don't have access yet?</h2>
      <p className="mb-5 text-sm text-brand-muted">
        Request a buyer or manufacturer workspace. Our team reviews each request and sends an invite.
      </p>

      <form onSubmit={submit} className="space-y-3 text-left">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          required
          className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          required
          className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
        />
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company (optional)"
          className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
        />
        <select
          value={intendedRole}
          onChange={(e) => setIntendedRole(e.target.value as "BUYER" | "MANUFACTURER")}
          className="w-full rounded border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal"
        >
          <option value="BUYER">Buyer</option>
          <option value="MANUFACTURER">Manufacturer</option>
        </select>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Anything we should know? (optional)"
          rows={3}
          className="w-full resize-none rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Request access"}
        </button>
        {err && <p className="text-xs text-red-600">{err}</p>}
      </form>
    </div>
  );
}
