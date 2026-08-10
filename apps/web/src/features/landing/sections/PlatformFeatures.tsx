import type { ReactNode } from "react";
import { SectionHead } from "../ui";

/* ── Lightweight mock "product screenshots" ──────────────────────────────
   These stand in for the real dashboard screenshots called for in the
   design. Swap each <MockX/> for an <img> once real captures exist. */

const TONE: Record<string, string> = {
  teal: "bg-brand-teal/10 text-brand-teal-dark",
  orange: "bg-brand-orange/10 text-brand-orange",
  gray: "bg-gray-100 text-gray-500",
};

function Badge({ label, tone }: { label: string; tone: keyof typeof TONE }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${TONE[tone]}`}>
      {label}
    </span>
  );
}

function DistributorMatchMock() {
  const rows = [
    { name: "Al Faisaliah Group", cat: "F&B / Dairy", score: "Verified", tone: "teal" as const },
    { name: "Ali Brothers LLC", cat: "Beverages", score: "Verified", tone: "teal" as const },
    { name: "Emirates Retail DMCC", cat: "Cosmetics", score: "Contacted", tone: "orange" as const },
    { name: "Nadec Trading", cat: "Meat & Poultry", score: "Listed", tone: "gray" as const },
  ];
  return (
    <div className="rounded-xl border border-brand-line bg-brand-bg-alt p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-wide text-brand-muted">
          Distributor Matches
        </span>
        <span className="rounded-full bg-brand-teal/10 px-2.5 py-1 text-[10px] font-bold text-brand-teal-dark">
          Saudi Arabia · UAE
        </span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between rounded-lg border border-brand-line bg-white px-3 py-2.5"
          >
            <div>
              <div className="text-[13px] font-semibold text-brand-ink">{r.name}</div>
              <div className="text-[11px] text-brand-muted">{r.cat}</div>
            </div>
            <Badge label={r.score} tone={r.tone} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DealPipelineMock() {
  const stages = [
    { name: "Outreach", deals: ["Rosten Oy", "Finnish Bakery"] },
    { name: "Negotiation", deals: ["Nordic Dairy"] },
    { name: "Signed", deals: ["BioFoods AB"] },
  ];
  return (
    <div className="rounded-xl border border-brand-line bg-brand-bg-alt p-4">
      <span className="mb-3 block text-[12px] font-bold uppercase tracking-wide text-brand-muted">
        Deal Pipeline
      </span>
      <div className="grid grid-cols-3 gap-2">
        {stages.map((s) => (
          <div key={s.name} className="rounded-lg bg-white p-2">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brand-teal-dark">
              {s.name}
            </div>
            <div className="space-y-1.5">
              {s.deals.map((d) => (
                <div
                  key={d}
                  className="rounded-md border border-brand-line px-2 py-1.5 text-[11px] font-medium text-brand-ink"
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountHealthMock() {
  const tiles = [
    { k: "Active distributors", v: "12" },
    { k: "Avg. confidence", v: "86%" },
    { k: "Renewals YTD", v: "9" },
    { k: "Open tickets", v: "2" },
  ];
  return (
    <div className="rounded-xl border border-brand-line bg-brand-bg-alt p-4">
      <span className="mb-3 block text-[12px] font-bold uppercase tracking-wide text-brand-muted">
        Account Health
      </span>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.k} className="rounded-lg border border-brand-line bg-white p-3">
            <div className="text-xl font-extrabold text-brand-teal">{t.v}</div>
            <div className="text-[11px] text-brand-muted">{t.k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureRow({
  title,
  body,
  media,
  reverse = false,
}: {
  title: string;
  body: string;
  media: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="mb-14 grid grid-cols-1 items-center gap-12 last:mb-0 md:grid-cols-2">
      <div className={reverse ? "md:order-2" : ""}>
        <h3 className="text-[22px] font-bold text-brand-ink">{title}</h3>
        <p className="mt-3 text-[15px] text-brand-muted">{body}</p>
        <a
          href="/assessment"
          className="mt-3 inline-flex rounded-full border border-brand-line px-4 py-2.5 text-[13px] font-bold text-brand-ink transition hover:border-brand-teal hover:text-brand-teal"
        >
          Learn more →
        </a>
      </div>
      <div className={reverse ? "md:order-1" : ""}>{media}</div>
    </div>
  );
}

export default function PlatformFeatures() {
  return (
    <section id="platform" className="scroll-mt-24 bg-white px-8 py-[72px]">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead
          eyebrow="Platform"
          title="Built to remove the guesswork from GCC market entry"
          sub="Every distributor record carries a confidence score. Every deal is run by a team, not left to a database."
        />
        <FeatureRow
          title="Verified matching"
          body="Search a network of Saudi and UAE distributors filtered by category, channel, and price tier — each record scored by how well it's actually been verified, not just listed."
          media={<DistributorMatchMock />}
        />
        <FeatureRow
          reverse
          title="Deal execution"
          body="From first outreach to signed contract, our team leads negotiation, term structuring, and closing — so a match turns into a working commercial relationship."
          media={<DealPipelineMock />}
        />
        <FeatureRow
          title="Relationship management"
          body="Post-signature account management keeps the partnership on track and feeds fresh data back into the network, improving every future match."
          media={<AccountHealthMock />}
        />
      </div>
    </section>
  );
}
