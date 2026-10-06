import { useState } from "react";
import type { FormEvent } from "react";
import { requestReport } from "../../../lib/api";
import type { Section, FormFieldDef } from "../content";
import { InputField, TextAreaField, ConsentNote, ReviewNote, FormFeedback } from "../fields";

export function ReportForm({ section }: { section: Section }) {
  const fields = (section.fields ?? []) as FormFieldDef[];
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("idle");
    setMessage("");
    try {
      await requestReport({
        subject: values.subject ?? "",
        message: values.message ?? "",
        email: values.email ?? "",
      });
      setStatus("ok");
      setMessage("Thank you — your request has been received. We'll be in touch shortly.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={onSubmit} noValidate>
      <div className="form-grid">
        {fields.map((f) => {
          if (f.kind === "textarea")
            return (
              <TextAreaField
                key={f.name}
                name={f.name}
                label={f.label}
                required={f.required}
                placeholder={f.placeholder ?? ""}
                value={values[f.name] ?? ""}
                onChange={(v) => set(f.name, v)}
              />
            );
          return (
            <InputField
              key={f.name}
              name={f.name}
              label={f.label}
              type={f.kind === "email" ? "email" : "text"}
              required={f.required}
              placeholder={f.placeholder ?? ""}
              value={values[f.name] ?? ""}
              onChange={(v) => set(f.name, v)}
            />
          );
        })}
      </div>
      <button type="submit" className="button" disabled={busy} aria-busy={busy}>
        {section.button ?? "Send request"} <span aria-hidden="true">↗︎</span>
      </button>
      <ConsentNote />
      <ReviewNote />
      <FormFeedback status={status} message={message} />
    </form>
  );
}
