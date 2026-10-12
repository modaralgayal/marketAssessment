import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { requestReport } from "../../../lib/api";
import type { Project } from "../content";
import { InputField, CountrySelect, ConsentNote, ReviewNote, FormFeedback } from "../fields";

export function OrganizationModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const f = project.forms.organization;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [country, setCountry] = useState("");
  const [support, setSupport] = useState<string[]>([]);
  const [priorities, setPriorities] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (dlg && !dlg.open) dlg.showModal();
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dlg?.addEventListener("cancel", onCancel);
    return () => dlg?.removeEventListener("cancel", onCancel);
  }, [onClose]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (support.length === 0) {
      setStatus("error");
      setMessage("Please select at least one way we can support your organization.");
      return;
    }
    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your work email.");
      return;
    }
    setBusy(true);
    setStatus("idle");
    setMessage("");
    try {
      const body: string[] = [];
      if (jobTitle) body.push(`Job title: ${jobTitle}`);
      if (organizationType) body.push(`Organization type: ${organizationType}`);
      if (country) body.push(`Country/territory: ${country}`);
      if (support.length) body.push(`Support requested: ${support.join(", ")}`);
      if (priorities) body.push(`Priorities:\n${priorities}`);
      await requestReport({
        subject: `Partnership enquiry from ${organizationName || fullName}`,
        message: body.join("\n"),
        email: email.trim(),
      });
      setStatus("ok");
      setMessage("Thank you — our partnerships team will be in touch shortly.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function toggleSupport(value: string, checked: boolean) {
    setSupport((p) => (checked ? [...p, value] : p.filter((v) => v !== value)));
  }

  return (
    <dialog className="modal organization-modal" ref={dialogRef} aria-labelledby="organization-title" onClose={onClose}>
      <div className="modal-head">
        <button type="button" className="organization-close modal-close" aria-label="Close contact form" onClick={onClose}>
          ×
        </button>
        <p className="eyebrow">FOR GOVERNMENTS &amp; ASSOCIATIONS</p>
        <h2 id="organization-title">{f.title}</h2>
        <p>{f.body}</p>
      </div>
      <form className="form-panel" onSubmit={onSubmit} noValidate>
        <h3>Contact details</h3>
        <div className="form-grid">
          <InputField name="fullName" label="Full name" value={fullName} onChange={setFullName} />
          <InputField name="email" label="Work email" type="email" value={email} onChange={setEmail} />
          <InputField name="jobTitle" label="Job title" required={false} value={jobTitle} onChange={setJobTitle} optional />
          <InputField name="organizationName" label="Organization name" value={organizationName} onChange={setOrganizationName} />
          <label className="form-field full">
            <span>Organization type *</span>
            <select name="organizationType" required value={organizationType} onChange={(e) => setOrganizationType(e.target.value)}>
              <option value="">Select organization type</option>
              {f.types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <CountrySelect name="country" label="Country/territory" value={country} onChange={setCountry} />
        </div>
        <fieldset className="support-options">
          <legend>How can we support your organization? *</legend>
          <p>Select all that apply.</p>
          {f.support.map((t) => (
            <label key={t}>
              <input
                type="checkbox"
                name="support"
                value={t}
                checked={support.includes(t)}
                onChange={(e) => toggleSupport(t, e.target.checked)}
              />
              <span>{t}</span>
            </label>
          ))}
        </fieldset>
        <label className="form-field">
          <span>Tell us about your priorities</span>
          <textarea
            name="priorities"
            rows={4}
            placeholder="Share the sectors, markets or programs you support and what you would like to achieve."
            value={priorities}
            onChange={(e) => setPriorities(e.target.value)}
          />
        </label>
        <button type="submit" className="button" disabled={busy} aria-busy={busy}>
          Request Contact <span aria-hidden="true">↗︎</span>
        </button>
        <ConsentNote />
        <ReviewNote />
        <FormFeedback status={status} message={message} />
      </form>
    </dialog>
  );
}
