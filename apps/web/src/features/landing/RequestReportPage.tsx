import { useState } from "react";
import { Link } from "react-router-dom";
import { requestReport } from "../../lib/api";
import SiteNav from "./SiteNav";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RequestReportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; message?: string; email?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!subject.trim()) next.subject = "Please add a short subject.";
    if (!message.trim()) next.message = "Tell us a little about your operation.";
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setError(null);
    try {
      await requestReport({ subject: subject.trim(), message: message.trim(), email: email.trim() });
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SiteNav />
      <div className="mx-auto max-w-[640px] px-6 py-16">
        {done ? (
          <div className="rounded-2xl border border-brand-line bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-bg-alt text-xl text-brand-teal">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-brand-ink">Request received</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">
              Thanks — we've received your request and will review it. If it's a fit, we'll email
              you a private invite link to access the assessment form.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-full border border-brand-line px-6 py-3 text-sm font-bold text-brand-ink transition hover:border-brand-teal hover:text-brand-teal"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[12px] font-bold uppercase tracking-wide text-brand-muted">Request a Report</p>
            <h1 className="mt-2 text-3xl font-bold text-brand-ink">Tell us about your operation</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">
              Share a bit about your company and how our GCC distributor connections could help,
              and the email where you'd like to receive your invite link. We review every request
              before sending access.
            </p>

            <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-ink">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Nordic dairy brand exploring KSA retail"
                  className="w-full rounded border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-teal"
                />
                {errors.subject && <p className="mt-1 text-[12px] text-red-600">{errors.subject}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-ink">
                  About your operation
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Tell us what you produce, your export experience, and how we might help you reach GCC distributors and retailers…"
                  className="w-full rounded border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-teal"
                />
                {errors.message && <p className="mt-1 text-[12px] text-red-600">{errors.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-ink">
                  Email for your invite link
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-teal"
                />
                {errors.email && <p className="mt-1 text-[12px] text-red-600">{errors.email}</p>}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-brand-teal px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-teal-dark disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Request access"}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
