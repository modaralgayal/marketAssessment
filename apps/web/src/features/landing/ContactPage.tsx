import { Link } from "react-router-dom";
import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-brand-ink">
      <SiteNav />
      <main className="mx-auto max-w-[820px] px-6 py-12 sm:px-8">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-brand-teal" />
          <div className="text-xs font-bold uppercase tracking-[3px] text-brand-teal">
            Get in touch
          </div>
        </div>
        <h1 className="mb-3 text-[30px] font-bold leading-tight text-brand-ink">
          Contact Us
        </h1>
        <p className="mb-10 text-sm text-brand-muted">
          We'd love to hear from you. Reach out and a member of our team will get back to you.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-md border border-brand-line bg-brand-bg-alt p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-[1px] text-brand-muted">
              Email
            </div>
            <div className="text-[15px] font-semibold text-brand-ink">[company email]</div>
          </div>
          <div className="rounded-md border border-brand-line bg-brand-bg-alt p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-[1px] text-brand-muted">
              Phone
            </div>
            <div className="text-[15px] font-semibold text-brand-ink">[company phone number]</div>
          </div>
        </div>

        <p className="mt-10 text-[13px] text-brand-muted">
          For privacy-related questions, see our{" "}
          <Link to="/privacy" className="text-brand-teal underline">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
