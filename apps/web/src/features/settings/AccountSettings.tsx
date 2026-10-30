import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth";
import {
  fetchPrivacyVersion,
  acceptPrivacy,
  exportMyData,
  deleteMyAccount,
} from "../../lib/api";
import { PasswordInput } from "../../components/ui/PasswordInput";
import DashboardLayout from "../dashboard/DashboardLayout";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-brand-line bg-white p-6">
      <h2 className="text-base font-bold text-brand-ink">{title}</h2>
      {description && <p className="mb-4 mt-1 text-sm text-brand-muted">{description}</p>}
      <div className={description ? "mt-4" : "mt-3"}>{children}</div>
    </section>
  );
}

const inputCls =
  "w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal";
const btnCls =
  "rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:opacity-50";

export default function AccountSettings() {
  const { account, user, logout, changePassword, changeEmail, reauthenticate } = useAuth();
  const navigate = useNavigate();

  const { data: privacy, isLoading: privacyLoading } = useQuery({
    queryKey: ["privacyVersion"],
    queryFn: fetchPrivacyVersion,
  });

  // Change password
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  // Change email
  const [emailCurPw, setEmailCurPw] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);

  // Privacy accept
  const [acceptBusy, setAcceptBusy] = useState(false);
  const [acceptMsg, setAcceptMsg] = useState<string | null>(null);

  // Delete
  const [delPw, setDelPw] = useState("");
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  const isGoogleOnly = user?.providerData?.every((p) => p.providerId !== "password") ?? false;

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwBusy(true);
    setPwMsg(null);
    setPwErr(null);
    try {
      await changePassword(curPw, newPw);
      setPwMsg("Password updated.");
      setCurPw("");
      setNewPw("");
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setPwBusy(false);
    }
  };

  const handleChangeEmail = async (e: FormEvent) => {
    e.preventDefault();
    setEmailBusy(true);
    setEmailMsg(null);
    setEmailErr(null);
    try {
      await changeEmail(emailCurPw, newEmail);
      setEmailMsg(`Verification sent to ${newEmail}. Confirm to finish the change.`);
      setEmailCurPw("");
      setNewEmail("");
    } catch (err) {
      setEmailErr(err instanceof Error ? err.message : "Could not update email.");
    } finally {
      setEmailBusy(false);
    }
  };

  const handleAccept = async () => {
    setAcceptBusy(true);
    setAcceptMsg(null);
    try {
      await acceptPrivacy();
      setAcceptMsg("Thanks — your acceptance is recorded.");
    } catch (err) {
      setAcceptMsg(err instanceof Error ? err.message : "Could not record acceptance.");
    } finally {
      setAcceptBusy(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tradelomacy-data-${(account?.id ?? "me").slice(-8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDelErr(err instanceof Error ? err.message : "Could not export your data.");
    }
  };

  const handleDelete = async () => {
    setDelErr(null);
    setDelBusy(true);
    try {
      await reauthenticate(delPw);
      await deleteMyAccount();
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      setDelErr(err instanceof Error ? err.message : "Could not delete your account.");
      setDelBusy(false);
    }
  };

  const accepted = account?.privacyAcceptedVersion ?? 0;
  const latest = privacy?.version ?? 0;
  const needsAccept = !privacyLoading && latest > 0 && accepted < latest;

  return (
    <DashboardLayout
      role={(account?.role === "MANUFACTURER" ? "MANUFACTURER" : "BUYER") as "BUYER" | "MANUFACTURER"}
      navItems={[{ key: "settings", label: "Settings" }]}
      active="settings"
      onSelect={() => {}}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <Section title="Email & password" description={`Signed in as ${account?.email ?? user?.email ?? "—"}.`}>
          {isGoogleOnly ? (
            <p className="text-sm text-brand-muted">
              This account signs in with Google, so password and email changes are managed by Google.
            </p>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleChangePassword} className="space-y-3">
                <h3 className="text-sm font-semibold text-brand-ink">Change password</h3>
                <PasswordInput
                  value={curPw}
                  onChange={(e) => setCurPw(e.target.value)}
                  placeholder="Current password"
                  required
                  autoComplete="current-password"
                  label="Current password"
                />
                <PasswordInput
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  label="New password"
                />
                <button type="submit" disabled={pwBusy} className={btnCls}>
                  {pwBusy ? "Updating…" : "Update password"}
                </button>
                {pwMsg && <p className="text-xs text-emerald-600">{pwMsg}</p>}
                {pwErr && <p className="text-xs text-red-600">{pwErr}</p>}
              </form>

              <form onSubmit={handleChangeEmail} className="space-y-3 border-t border-brand-line pt-5">
                <h3 className="text-sm font-semibold text-brand-ink">Change email</h3>
                <PasswordInput
                  value={emailCurPw}
                  onChange={(e) => setEmailCurPw(e.target.value)}
                  placeholder="Current password"
                  required
                  autoComplete="current-password"
                  label="Current password"
                />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="New email"
                  required
                  autoComplete="email"
                  className={inputCls}
                />
                <button type="submit" disabled={emailBusy} className={btnCls}>
                  {emailBusy ? "Updating…" : "Update email"}
                </button>
                {emailMsg && <p className="text-xs text-emerald-600">{emailMsg}</p>}
                {emailErr && <p className="text-xs text-red-600">{emailErr}</p>}
              </form>
            </div>
          )}
        </Section>

        <Section
          title="Privacy policy"
          description="We record which version of the privacy policy you've accepted."
        >
          <p className="text-sm text-brand-muted">
            Accepted version: <span className="font-semibold text-brand-ink">{accepted || "—"}</span>
            {latest > 0 && (
              <>
                {" "}· Latest: <span className="font-semibold text-brand-ink">{latest}</span>
                {privacy?.effectiveDate &&
                  ` (effective ${new Date(privacy.effectiveDate).toLocaleDateString()})`}
              </>
            )}
            .{" "}
            <a href="/privacy" target="_blank" rel="noreferrer" className="font-medium text-brand-teal hover:underline">
              View policy
            </a>
          </p>
          {needsAccept && (
            <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                A new privacy policy (v{latest}) is available. Please review and accept it.
              </p>
              <button
                onClick={handleAccept}
                disabled={acceptBusy}
                className="mt-2 rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {acceptBusy ? "Saving…" : "Accept latest policy"}
              </button>
            </div>
          )}
          {acceptMsg && <p className="mt-2 text-xs text-emerald-600">{acceptMsg}</p>}
        </Section>

        <Section title="Your data" description="Download a copy of the data we hold about your account.">
          <button onClick={handleExport} className="rounded-full border border-brand-line px-4 py-2 text-sm font-semibold text-brand-ink hover:border-brand-teal hover:text-brand-teal">
            Export my data (JSON)
          </button>
        </Section>

        <Section
          title="Delete account"
          description="Permanently delete your account and all associated data (profile, opportunity cards, matches). This cannot be undone."
        >
          {isGoogleOnly ? (
            <p className="text-sm text-brand-muted">
              For your security, confirm your Google account password to delete.
            </p>
          ) : null}
          <div className="space-y-3">
            <PasswordInput
              value={delPw}
              onChange={(e) => setDelPw(e.target.value)}
              placeholder="Enter your password to confirm"
              required
              autoComplete="current-password"
              label="Confirm password"
            />
            <button
              onClick={handleDelete}
              disabled={delBusy || !delPw}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            >
              {delBusy ? "Deleting…" : "Delete my account"}
            </button>
            {delErr && <p className="text-xs text-red-600">{delErr}</p>}
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}
