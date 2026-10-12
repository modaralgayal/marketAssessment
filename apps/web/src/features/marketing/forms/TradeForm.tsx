import { useState } from "react";
import type { FormEvent } from "react";
import { requestAccess } from "../../../lib/api";
import type { Project, Section, FormFieldDef } from "../content";
import {
  InputField,
  TextAreaField,
  CountrySelect,
  CountryMultiSelect,
  ConsentNote,
  ReviewNote,
  FormFeedback,
} from "../fields";

export function TradeForm({ project, section }: { project: Project; section: Section }) {
  const sourcing = section.mode === "sourcing";
  const fields = sourcing ? [] : project.forms.start.fields;

  const [values, setValues] = useState<Record<string, string>>({});
  const [country, setCountry] = useState("");
  const [targetMarket, setTargetMarket] = useState<string[]>([]);
  const [sourceCountries, setSourceCountries] = useState<string[]>([]);
  const [products, setProducts] = useState("");
  const [details, setDetails] = useState("");
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
      if (sourcing && !products.trim())
        throw new Error("Please describe the products you are sourcing.");
      if (sourcing && sourceCountries.length === 0)
        throw new Error("Please select at least one country you want to source from.");

      // Drive the self-service onboarding instead of the old leads pipeline:
      // a visitor requests a workspace, an admin reviews it, and on approval an
      // invite to CREATE an account is emailed. Role follows the form's mode.
      const name = (values.fullName ?? values.name ?? "").trim();
      const company = (values.companyName ?? values.company ?? "").trim();
      const email = (values.email ?? "").trim();
      if (!name) throw new Error("Please enter your name.");
      if (!email) throw new Error("Please enter your email address.");

      const details2: string[] = [];
      if (country) details2.push(`Country: ${country}`);
      if (values.website) details2.push(`Website: ${values.website}`);
      if (products) details2.push(`Products: ${products}`);
      if (targetMarket.length) details2.push(`Target markets: ${targetMarket.join(", ")}`);
      if (sourceCountries.length)
        details2.push(`Source countries: ${sourceCountries.join(", ")}`);
      if (values.phone) details2.push(`Phone: ${values.phone}`);
      if (details) details2.push(details);

      await requestAccess({
        name,
        email,
        company: company || undefined,
        intendedRole: sourcing ? "BUYER" : "MANUFACTURER",
        message: details2.length ? details2.join("\n") : undefined,
      });
      setStatus("ok");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <a className="back-link" href="/start-trading">
        ← Start trading
      </a>

      {status === "ok" ? (
        <div className="trade-form-layout">
          <div className="trade-form-intro">
            <p className="eyebrow">{sourcing ? "FOR SOURCING" : "FOR EXPORTING"}</p>
            <h1>Request received</h1>
            <p className="section-intro">
              Thanks — we've received your request for a {sourcing ? "buyer" : "manufacturer"} workspace.
              Our team will review it and email you an invite to create your account.
            </p>
            <a href="/login" className="button">
              Sign in / create account <span aria-hidden="true">↗︎</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="trade-form-layout">
          <div className="trade-form-intro">
            <p className="eyebrow">{sourcing ? "FOR SOURCING" : "FOR EXPORTING"}</p>
            <h1>{section.title}</h1>
            <p className="section-intro">{section.body}</p>
            {section.steps && section.steps.length > 0 && (
              <ol className="numbered-process">
                {section.steps.map((s, i) => (
                  <li key={i}>
                    <span className="number-icon" aria-hidden="true">
                      {i + 1}
                    </span>
                    <p>{s}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <form className="form-panel trade-form" onSubmit={onSubmit} noValidate>
            <h2>{sourcing ? "Your sourcing requirements" : "Your company & export plans"}</h2>
            <div className="form-grid">
              {sourcing ? (
                <>
                  <InputField name="companyName" label="Company name" value={values.companyName ?? ""} onChange={(v) => set("companyName", v)} />
                  <CountrySelect name="country" label="Country" value={country} onChange={setCountry} />
                  <InputField name="website" label="Website" type="url" required={false} placeholder="https://company.com" value={values.website ?? ""} onChange={(v) => set("website", v)} optional />
                  <TextAreaField
                    name="products"
                    label="Products you are sourcing"
                    required
                    rows={3}
                    placeholder="Frozen berries, chocolate bars… Add several product keywords, separated by commas."
                    value={products}
                    onChange={setProducts}
                  />
                  <CountryMultiSelect name="sourceCountries" label="From which countries do you want to source the product?" value={sourceCountries} onChange={setSourceCountries} />
                  <h3 className="form-subhead">Contact person</h3>
                  <InputField name="fullName" label="Name" value={values.fullName ?? ""} onChange={(v) => set("fullName", v)} />
                  <InputField name="email" label="Email address" type="email" value={values.email ?? ""} onChange={(v) => set("email", v)} />
                  <InputField name="phone" label="Phone number" type="tel" value={values.phone ?? ""} onChange={(v) => set("phone", v)} />
                  <TextAreaField
                    name="details"
                    label="Tell us more"
                    required={false}
                    rows={5}
                    placeholder="How can we help? Tell us about your pressing challenges or anything that would help us fulfil your request."
                    value={details}
                    onChange={setDetails}
                  />
                </>
              ) : (
                (fields as FormFieldDef[]).map((f) => {
                  if (f.name === "targetMarket")
                    return (
                      <CountryMultiSelect
                        key={f.name}
                        name={f.name}
                        label="Target export markets"
                        exportOnly
                        value={targetMarket}
                        onChange={setTargetMarket}
                      />
                    );
                  if (f.name === "country")
                    return <CountrySelect key={f.name} name={f.name} label={f.label} value={country} onChange={setCountry} />;
                  return (
                    <InputField
                      key={f.name}
                      name={f.name}
                      label={f.label}
                      type={f.kind === "email" ? "email" : f.kind === "website" ? "url" : "text"}
                      required={f.required}
                      placeholder={f.placeholder ?? ""}
                      value={values[f.name] ?? ""}
                      onChange={(v) => set(f.name, v)}
                    />
                  );
                })
              )}
            </div>
            <button type="submit" className="button" disabled={busy} aria-busy={busy}>
              {sourcing ? "Request buyer access" : "Request manufacturer access"}{" "}
              <span aria-hidden="true">↗︎</span>
            </button>
            <ConsentNote />
            <ReviewNote />
            <FormFeedback status={status} message={message} />
          </form>
        </div>
      )}
    </div>
  );
}
