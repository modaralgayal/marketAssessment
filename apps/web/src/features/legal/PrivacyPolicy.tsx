import { Link } from "react-router-dom";
import SiteNav from "../landing/SiteNav";

/**
 * Privacy Policy page.
 *
 * NOTE TO THE OPERATOR: This is a GDPR-aligned transparency document (Articles
 * 13–14). It is a TEMPLATE. Everything in [SQUARE BRACKETS] must be completed
 * with your real details, and the document must be reviewed by qualified GDPR
 * counsel before publication. A privacy policy reduces, but cannot eliminate,
 * legal liability — liability follows from actual conduct (lawful basis,
 * executed DPAs/SCCs, enforced retention, security, and honored rights).
 */

const EFFECTIVE_DATE = "17 August 2026";

// Controller identity — replace placeholders with verified details.
const CONTROLLER = {
  name: "Integrate Us Oy",
  businessId: "[Finnish business ID, e.g. 1234567-8]",
  address: "[Registered street address, postcode, city, Finland]",
  email: "privacy@[your-domain.com]",
  contactEmail: "jaber.algayal24@gmail.com",
  dpo: "[Name / 'privacy@[your-domain.com]' — appoint if required under Art. 37]",
  supervisoryAuthority:
    "The Finnish Data Protection Ombudsman (Tietosuojavaltuutetun toimisto), https://tietosuoja.fi",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white font-sans text-brand-ink">
      <SiteNav />
      <main className="mx-auto max-w-[820px] px-6 py-12 sm:px-8">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-brand-teal" />
          <div className="text-xs font-bold uppercase tracking-[3px] text-brand-teal">
            {CONTROLLER.name}
          </div>
        </div>
        <h1 className="mb-2 text-[30px] font-bold leading-tight text-brand-ink">
          Privacy Policy
        </h1>
        <p className="mb-8 text-sm text-brand-muted">
          Effective date: {EFFECTIVE_DATE}. Last updated: {EFFECTIVE_DATE}.
        </p>

        <Notice>
          This Privacy Policy explains how {CONTROLLER.name} ("we", "us", "our") collects, uses,
          shares, and protects personal data when you use our GCC market-entry assessment platform
          (the "Service"), including the public assessment form and our use of artificial
          intelligence in evaluating submissions. It is written to meet our transparency
          obligations under the EU General Data Protection Regulation (GDPR, Regulation (EU)
          2016/679).
        </Notice>

        <Toc />

        {/* 1. Who we are */}
        <Section n="1" id="controller" title="Who is responsible for your data (Data Controller)">
          <p>
            The data controller for the personal data described in this policy is:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>{CONTROLLER.name}</strong> (Business ID: {CONTROLLER.businessId})
            </li>
            <li>Registered address: {CONTROLLER.address}</li>
            <li>
              Privacy contact: {CONTROLLER.email} (or {CONTROLLER.contactEmail})
            </li>
            <li>
              Data Protection Officer / representative: {CONTROLLER.dpo}
            </li>
          </ul>
          <p className="mt-3">
            If you have questions about this policy or wish to exercise your rights, contact us at
            the address above.
          </p>
        </Section>

        {/* 2. Scope */}
        <Section n="2" id="scope" title="Scope of this policy">
          <p>This policy applies to personal data we process when you:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Submit the public market-entry self-assessment form;</li>
            <li>Upload a product catalogue / price list as part of that form;</li>
            <li>Communicate with us about your submission; or</li>
            <li>Otherwise interact with the Service as a prospective client.</li>
          </ul>
          <p className="mt-3">
            It does not cover websites or services operated by third parties that we merely link to.
          </p>
          <p className="mt-3">
            The Service is intended for businesses and professionals aged 18 or over. We do not
            knowingly collect personal data from anyone under the age of 18.
          </p>
        </Section>

        {/* 3. What we collect */}
        <Section n="3" id="data" title="What personal data we collect">
          <p>
            We collect the following categories of personal data. Much of it relates to a company,
            but it also includes personal data of the individual who submits and, where present,
            other individuals named in uploaded material.
          </p>

          <h3 className="mt-5 font-semibold">3.1 Information you provide in the form</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Company profile:</strong> company name, country of registration, website,
              industry / product category, annual revenue (and any free-text specification),
              years in business, current export markets.
            </li>
            <li>
              <strong>Products &amp; operations:</strong> shelf life, frozen-storage requirement,
              halal certification status, SFDA/ADAFSA registration status, held certifications,
              label languages, product adaptability, branding approach, lead times.
            </li>
            <li>
              <strong>Target market:</strong> current GCC activity, active GCC markets, free-text
              description of current GCC situation, target-market potential, sales channels, channel
              strategy.
            </li>
            <li>
              <strong>Operational readiness:</strong> minimum order quantity, whether a dedicated
              export contact exists, available production capacity.
            </li>
            <li>
              <strong>Decision-maker contact:</strong> full name, job title / position, email
              address, phone number, and any additional free-text information you choose to provide
              (the "Tell us everything relevant" field).
            </li>
          </ul>

          <h3 className="mt-5 font-semibold">3.2 Catalogue / price-list files you upload</h3>
          <p>
            Submission requires at least one file (PDF, Word, Excel, CSV, or similar). These files
            may contain product specifications, pricing, certifications, and business contact
            details. <strong>They may also contain personal data of third parties</strong> (for
            example, employee or customer names, email addresses, or phone numbers). You are
            responsible for ensuring you have a lawful basis to share any third-party personal data
            in these files, and for minimising unrelated personal data before uploading.
          </p>

          <h3 className="mt-5 font-semibold">3.3 Technical and metadata</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Server log data such as your IP address, date/time, and request metadata, retained
              briefly for security and abuse prevention.
            </li>
            <li>File metadata: original filename, content type, and size.</li>
            <li>
              For administrators: the Google account identifier used to sign in (email, name, and
              associated profile data provided by Google).
            </li>
          </ul>
        </Section>

        {/* 4. Purposes and legal basis */}
        <Section n="4" id="purposes" title="Why we process your data and our legal basis">
          <p>
            We process your personal data only where we have a lawful basis under Article 6 GDPR.
          </p>
          <div className="mt-4 overflow-hidden rounded-md border border-brand-line">
            <table className="w-full text-[13px]">
              <thead className="bg-brand-bg-alt text-brand-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Purpose</th>
                  <th className="px-3 py-2 text-left font-semibold">Data used</th>
                  <th className="px-3 py-2 text-left font-semibold">Legal basis (Art. 6)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line">
                <Row
                  purpose="Assess your suitability for GCC market entry and provide the evaluation you requested"
                  data="All form fields and uploaded files"
                  basis="Contract / pre-contractual steps (Art. 6(1)(b)) and our legitimate interest in operating and developing the Service (Art. 6(1)(f))"
                />
                <Row
                  purpose="Extract structured data from uploaded catalogues, score your submission, and match you with potential distributors"
                  data="Form fields and uploaded-file content"
                  basis="Your consent (Art. 6(1)(a)) — see Section 5; alternatively legitimate interest (Art. 6(1)(f)) for the assessment itself"
                />
                <Row
                  purpose="Communicate with you about your submission and our services"
                  data="Contact details"
                  basis="Contract / pre-contractual steps (Art. 6(1)(b)) and legitimate interest (Art. 6(1)(f))"
                />
                <Row
                  purpose="Secure the Service, prevent fraud and abuse, and comply with legal obligations"
                  data="IP address, log data, account data"
                  basis="Legitimate interest (Art. 6(1)(f)) and legal obligation (Art. 6(1)(c))"
                />
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            Where we rely on <strong>legitimate interests</strong>, we have balanced those interests
            against your rights and freedoms. You may object at any time (see Section 10).
          </p>
        </Section>

        {/* 5. AI disclosure */}
        <Section n="5" id="ai" title="Use of artificial intelligence in our assessment">
          <Callout>
            <strong>We use AI in our reasoning when we collect and evaluate your data.</strong> When
            you submit the form and your catalogue, we use an artificial-intelligence system —
            Anthropic Claude, operated by Anthropic PBC (United States) — as part of how we assess
            your submission.
          </Callout>

          <p className="mt-3">Specifically, AI is used in three steps of our evaluation:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              <strong>Catalogue extraction.</strong> The text of the files you upload is sent to
              Anthropic Claude, which reads it and extracts structured data (product names,
              categories, certifications, pricing, packaging, and contact details).
            </li>
            <li>
              <strong>Scoring.</strong> Your submission is evaluated by Claude against our assessment
              criteria to produce a readiness score and a written explanation.
            </li>
            <li>
              <strong>Distributor matching.</strong> Your profile is compared by Claude against our
              distributor database to identify potentially compatible commercial partners.
            </li>
          </ol>

          <h3 className="mt-5 font-semibold">Automated processing and profiling</h3>
          <p>
            The scoring and matching steps involve <strong>automated processing, including
            profiling</strong>, as defined in Article 4(4) GDPR. The outputs inform a
            human-reviewed assessment: a member of our team reviews the AI-generated score,
            explanation, and matches before any view is finalised or shared with you.{" "}
            <strong>Our AI agents never act alone.</strong> They are assistants only: every suggestion
            they produce is reviewed and explicitly signed off by a human member of our team before any
            action is taken. We do{" "}
            <strong>not</strong> make decisions producing legal or similarly significant effects
            about you based <em>solely</em> on automated processing without human involvement
            (Article 22(1)). If this were to change, we would update this policy and provide the
            Article 22 safeguards (the right to human intervention, to express your point of view,
            and to contest the decision).
          </p>

          <h3 className="mt-5 font-semibold">How your data is handled by our AI provider</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Catalogue text and submission content are transmitted to Anthropic PBC in the United
              States for processing.
            </li>
            <li>
              In accordance with our processor's terms, your data is <strong>not used to train the
              model</strong> and is handled under a data-processing agreement that prohibits use for
              model training.
            </li>
            <li>
              We minimise what is sent: only the content needed for the relevant step is transmitted,
              and we do not send data unrelated to the assessment.
            </li>
          </ul>

          <h3 className="mt-5 font-semibold">
            Developing our analytics and AI assistant — trade data only
          </h3>
          <p>
            We use the <strong>trade-related attributes</strong> of past submissions — such as product
            category, shelf life, certifications, target markets, and production capacity — to develop
            and train our internal analytics and the AI assistant that helps our team reason about and
            suggest distributor–manufacturer matches. For this purpose we use{" "}
            <strong>only trade-related data</strong>: all personal information is removed first, and we
            do <strong>not</strong> use company names either. No personal data — not even a company
            name — is used to train our analytics. This use involves no personal data and is therefore
            outside the scope of the GDPR. This is separate from our AI provider's processing: as noted
            above, that provider does not train its own models on your data.
          </p>

          <h3 className="mt-5 font-semibold">Your consent</h3>
          <p>
            Because the uploaded catalogue may contain third-party personal data and because AI
            processing involves a transfer to a third country, we rely on your{" "}
            <strong>consent</strong> (Article 6(1)(a) and Article 49(1)(a)) for the AI extraction,
            scoring, and matching of your submission and its attached files. Consent is given by
            ticking the consent box on the assessment form before submitting. You may{" "}
            <strong>withdraw consent at any time</strong> (Article 7(3)) without affecting the
            lawfulness of processing already carried out, by contacting us at the address in Section
            1. Withdrawing consent may mean we cannot complete the AI-assisted assessment.
          </p>
        </Section>

        {/* 6. Recipients */}
        <Section n="6" id="recipients" title="Who we share your data with">
          <p>
            We do not sell your personal data. We share it only with the following categories of
            recipients, each acting as our processor or under another lawful arrangement:
          </p>
          <div className="mt-4 overflow-hidden rounded-md border border-brand-line">
            <table className="w-full text-[13px]">
              <thead className="bg-brand-bg-alt text-brand-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Recipient</th>
                  <th className="px-3 py-2 text-left font-semibold">Role</th>
                  <th className="px-3 py-2 text-left font-semibold">Data shared</th>
                  <th className="px-3 py-2 text-left font-semibold">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line">
                <Row4
                  a="Render (render.com)"
                  b="Hosting of the website and database"
                  c="All submission data and files"
                  d="EU / United States"
                />
                <Row4
                  a="Cloudflare (R2 object storage)"
                  b="Storage of uploaded catalogue files"
                  c="Uploaded files"
                  d="Global (incl. United States)"
                />
                <Row4
                  a="Anthropic PBC"
                  b="AI processing (extraction, scoring, matching)"
                  c="Form fields and uploaded-file content"
                  d="United States"
                />
                <Row4
                  a="Google (Firebase / Google Identity)"
                  b="Administrator sign-in and internal tooling"
                  c="Administrator account data"
                  d="United States / global"
                />
                <Row4
                  a="Our staff and authorised contractors"
                  b="Delivering the assessment and Service"
                  c="Submission data as needed"
                  d="EEA"
                />
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            We enter into data-processing agreements with each processor requiring them to process
            personal data only on our documented instructions and to apply appropriate safeguards.
          </p>
        </Section>

        {/* 7. International transfers */}
        <Section n="7" id="transfers" title="International data transfers">
          <p>
            Some recipients (Anthropic PBC, Cloudflare, Google, and potentially Render) are located
            in or process data in the <strong>United States</strong> or other countries outside the
            European Economic Area (EEA). When we transfer personal data outside the EEA, we rely on
            appropriate safeguards under Chapter V GDPR, typically the{" "}
            <strong>Standard Contractual Clauses</strong> (Commission Implementing Decision
            2021/914) supplemented by technical measures (such as encryption), or another
            Article 46 mechanism, or an adequacy decision where one applies.
          </p>
          <p className="mt-3">
            You may request a copy of the relevant safeguards by contacting us at the address in
            Section 1.
          </p>
        </Section>

        {/* 8. Retention */}
        <Section n="8" id="retention" title="How long we keep your data">
          <p>
            We keep personal data only for as long as necessary for the purposes described in this
            policy, after which we delete or anonymise it. Our current retention periods are:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Assessment submissions and attached files:{" "}
              <strong>3 years</strong> from the date of submission, or until the end of any
              resulting client relationship plus 7 years for legal-claims limitation periods.
            </li>
            <li>
              AI-extracted structured data and scores: retained with the associated submission for
              the same period.
            </li>
            <li>
              Server logs and IP metadata: <strong>[up to 90 days]</strong>, extended only where
              needed for security investigations.
            </li>
            <li>
              Administrator account data: for the duration of the administrative relationship.
            </li>
          </ul>
          <p className="mt-3">
            Where you exercise your right to erasure (Section 10), we delete your data within{" "}
            <strong>[30 days]</strong> unless we must retain it to comply with a legal obligation or
            to establish, exercise, or defend legal claims.
          </p>
        </Section>

        {/* 9. Security */}
        <Section n="9" id="security" title="How we protect your data">
          <p>We apply appropriate technical and organisational measures, including:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Encryption of data in transit (HTTPS/TLS) and at rest;</li>
            <li>Access controls and authentication for administrative access (Google sign-in);</li>
            <li>Role-based access limited to staff who need the data;</li>
            <li>Monitoring and logging of access to submissions;</li>
            <li>Regular review of our sub-processors and their safeguards.</li>
          </ul>
          <p className="mt-3">
            No method of transmission or storage is completely secure; we work to protect your data
            but cannot guarantee absolute security.
          </p>
        </Section>

        {/* 10. Your rights */}
        <Section n="10" id="rights" title="Your rights under the GDPR">
          <p>Subject to the conditions in the GDPR, you have the right to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Access</strong> the personal data we hold about you (Art. 15);</li>
            <li><strong>Rectify</strong> inaccurate or incomplete data (Art. 16);</li>
            <li><strong>Erase</strong> your data ("right to be forgotten", Art. 17);</li>
            <li><strong>Restrict</strong> processing in certain circumstances (Art. 18);</li>
            <li><strong>Data portability</strong> — receive your data in a structured, commonly used format (Art. 20);</li>
            <li><strong>Object</strong> to processing based on legitimate interests, including profiling (Art. 21);</li>
            <li><strong>Withdraw consent</strong> at any time where processing is based on consent (Art. 7(3));</li>
            <li>
              <strong>Lodge a complaint</strong> with a supervisory authority — in Finland,{" "}
              {CONTROLLER.supervisoryAuthority}.
            </li>
          </ul>
          <p className="mt-3">
            To exercise any right, contact us at {CONTROLLER.email}. We may need to verify your
            identity. We respond within <strong>one month</strong>, extendable by two further months
            for complex requests.
          </p>
        </Section>

        {/* 11. Disclaimer */}
        <Section n="11" id="disclaimer" title="Legal status of this document">
          <Notice>
            This Privacy Policy is provided for transparency and as a starting template. It is{" "}
            <strong>not legal advice</strong>. Publication of a privacy policy does not, by itself,
            guarantee compliance with the GDPR or eliminate legal liability. Compliance depends on
            actual conduct — including executed data-processing agreements and Standard Contractual
            Clauses with each sub-processor, enforced retention periods, appropriate security, timely
            breach notification, and the honoured exercise of data-subject rights. Have this document
            reviewed by qualified GDPR counsel and confirm the operational measures it describes are
            in place before relying on it.
          </Notice>
        </Section>

        {/* 12. Contact */}
        <Section n="12" id="contact" title="Contact us">
          <p>
            {CONTROLLER.name}
            <br />
            {CONTROLLER.address}
            <br />
            Privacy contact: {CONTROLLER.email} (or {CONTROLLER.contactEmail})
          </p>
          <p className="mt-4">
            <Link to="/" className="text-brand-teal underline">
              ← Back to the Service
            </Link>
          </p>
        </Section>
      </main>
    </div>
  );
}

/* ── Layout helpers ─────────────────────────────────────────────────────── */

function Section({
  n,
  id,
  title,
  children,
}: {
  n: string;
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
      <h2 className="mb-3 flex items-baseline gap-2 text-[19px] font-bold text-brand-ink">
        <span className="text-brand-teal">{n}.</span>
        {title}
      </h2>
      <div className="space-y-3 text-[14px] leading-relaxed text-brand-muted">{children}</div>
    </section>
  );
}

function Toc() {
  const items = [
    ["controller", "Who is responsible (Controller)"],
    ["scope", "Scope"],
    ["data", "What data we collect"],
    ["purposes", "Purposes & legal basis"],
    ["ai", "Use of artificial intelligence"],
    ["recipients", "Who we share data with"],
    ["transfers", "International transfers"],
    ["retention", "Retention"],
    ["security", "Security"],
    ["rights", "Your rights"],
    ["disclaimer", "Legal status"],
    ["contact", "Contact"],
  ];
  return (
    <nav className="mb-10 rounded-md border border-brand-line bg-brand-bg-alt p-5">
      <div className="mb-2 text-xs font-bold uppercase tracking-[1px] text-brand-muted">
        Contents
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {items.map(([href, label]) => (
          <li key={href}>
            <a href={`#${href}`} className="text-[13px] text-brand-teal hover:underline">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Row({ purpose, data, basis }: { purpose: string; data: string; basis: string }) {
  return (
    <tr className="align-top">
      <td className="px-3 py-2 text-brand-ink">{purpose}</td>
      <td className="px-3 py-2">{data}</td>
      <td className="px-3 py-2">{basis}</td>
    </tr>
  );
}

function Row4({ a, b, c, d }: { a: string; b: string; c: string; d: string }) {
  return (
    <tr className="align-top">
      <td className="px-3 py-2 font-medium text-brand-ink">{a}</td>
      <td className="px-3 py-2">{b}</td>
      <td className="px-3 py-2">{c}</td>
      <td className="px-3 py-2">{d}</td>
    </tr>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-brand-line bg-brand-bg-alt px-5 py-4 text-[14px] leading-relaxed text-brand-muted">
      {children}
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border-l-4 border-brand-teal bg-[#0F7B7F]/5 px-5 py-4 text-[14px] leading-relaxed text-brand-ink">
      {children}
    </div>
  );
}
