import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { COUNTRIES } from "../../lib/countries";
import {
  fetchManufacturerProfile,
  uploadOpportunityCardAsset,
  addOpportunityCardAssetLink,
  deleteOpportunityCardAsset,
  createOpportunityCard,
  updateOpportunityCard,
  type ManufacturerFileInfo,
  type OpportunityAsset,
  type OpportunityCardDto,
  type OpportunityRef,
  type OpportunityStatus,
} from "../../lib/api";

const PARTNER_TYPES = [
  "Distributor / importer",
  "Retailer",
  "Wholesaler",
  "Foodservice partner",
  "Private-label buyer",
  "Industrial buyer",
  "Other",
];

const OPP_CHANNELS = [
  "Modern retail / supermarkets",
  "Traditional retail",
  "Wholesale",
  "HoReCa / foodservice",
  "Ecommerce",
  "Industrial / ingredients",
];

const CARD_STATUS_OPTIONS = [
  "Draft",
  "Ready for internal review",
  "Open for buyer engagement",
  "Paused",
  "Closed",
];

/** The status labels the editor exposes — these match the shared schema's `status` enum. */
type CardStatusLabel =
  | "Draft"
  | "Ready for internal review"
  | "Open for buyer engagement"
  | "Paused"
  | "Closed";

/** Map the internal enum back to the model's status label for the editor. */
function statusToLabel(status?: OpportunityStatus): CardStatusLabel {
  if (status === "POSTED") return "Open for buyer engagement";
  if (status === "ARCHIVED") return "Closed";
  return "Draft";
}

interface Props {
  initial?: OpportunityCardDto;
  /** Shown in the heading + button, e.g. "opportunity" or "sourcing need". */
  noun: string;
  onSaved: (card: OpportunityCardDto) => void;
  onCancel: () => void;
  /** Navigate to the manufacturer profile's catalogue section (empty-state helper). */
  onGoToCatalogue?: () => void;
}

export default function OpportunityCardEditor({ initial, noun, onSaved, onCancel, onGoToCatalogue }: Props) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [territory, setTerritory] = useState(initial?.territory ?? "");
  const [partner, setPartner] = useState(initial?.partner ?? "");
  const [channels, setChannels] = useState<string[]>(initial?.channels ?? []);
  const [timing, setTiming] = useState(initial?.timing ?? "");
  const [status, setStatus] = useState<CardStatusLabel>(statusToLabel(initial?.status));
  const [objective, setObjective] = useState(initial?.objective ?? initial?.summary ?? "");
  const [moq, setMoq] = useState(initial?.moq ?? "");
  const [payment, setPayment] = useState(initial?.payment ?? "");
  const [delivery, setDelivery] = useState(initial?.delivery ?? "");
  const [rights, setRights] = useState(initial?.rights ?? "");
  const [validUntil, setValidUntil] = useState(initial?.validUntil ?? "");
  const [support, setSupport] = useState(initial?.support ?? "");
  // Catalogue references: selected profile file ids.
  const [selectedSources, setSelectedSources] = useState<string[]>(
    (initial?.sources ?? []).map((s) => s.id ?? "").filter(Boolean),
  );
  // Finalized price-list / terms attachments.
  const [assets, setAssets] = useState<OpportunityAsset[]>(
    (initial?.assets ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      kind: (a.kind as "pdf" | "link") ?? "pdf",
      url: a.url,
    })),
  );
  // Create-mode staging (server upload needs an existing card id).
  const [pendingPdf, setPendingPdf] = useState<File[]>([]);
  const [pendingLinks, setPendingLinks] = useState<{ url: string; name?: string }[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["manufacturer-profile"],
    queryFn: fetchManufacturerProfile,
    retry: false,
  });
  const profileFiles: ManufacturerFileInfo[] = profile?.files ?? [];

  const toggleChannel = (c: string) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleSource = (id: string) =>
    setSelectedSources((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const attachPdfLive = async (file: File) => {
    if (!initial) return;
    setBusy(true);
    try {
      const up = await uploadOpportunityCardAsset(initial.id, file);
      setAssets((a) => [...a, { id: up.id, name: up.name, kind: "pdf", contentType: up.contentType, sizeBytes: up.sizeBytes }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload.");
    } finally {
      setBusy(false);
    }
  };
  const attachLinkLive = async () => {
    if (!initial || !linkUrl.trim()) return;
    setBusy(true);
    try {
      const up = await addOpportunityCardAssetLink(initial.id, linkUrl.trim());
      setAssets((a) => [...a, { id: up.id, name: up.name, kind: "link", url: up.url }]);
      setLinkUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add link.");
    } finally {
      setBusy(false);
    }
  };
  const removeAsset = async (idx: number) => {
    const a = assets[idx];
    if (a.id && isEdit) {
      try {
        await deleteOpportunityCardAsset(initial!.id, a.id);
      } catch {
        /* best-effort */
      }
    }
    setAssets((arr) => arr.filter((_, i) => i !== idx));
  };

  const buildSources = (): OpportunityRef[] =>
    profileFiles
      .filter((f) => selectedSources.includes(f.id))
      .map((f) => ({ id: f.id, name: f.originalName, kind: f.kind === "link" ? "link" : "pdf" }));

  const buildPayload = (sources: OpportunityRef[], assetList: OpportunityAsset[]) => ({
    title: title.trim(),
    territory: territory.trim() || undefined,
    partner: partner.trim() || undefined,
    channels,
    timing: timing.trim() || undefined,
    status,
    objective: objective.trim() || undefined,
    // Keep `summary` in sync with the objective so the buyer browse view shows it.
    summary: objective.trim() || undefined,
    moq: moq.trim() || undefined,
    payment: payment.trim() || undefined,
    delivery: delivery.trim() || undefined,
    rights: rights.trim() || undefined,
    validUntil: validUntil.trim() || undefined,
    support: support.trim() || undefined,
    sources,
    assets: assetList,
    attributes: {},
  });

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("An opportunity title is required.");
      return;
    }
    setBusy(true);
    try {
      const sources = buildSources();
      if (isEdit) {
        const saved = await updateOpportunityCard(initial!.id, buildPayload(sources, assets));
        onSaved(saved);
        return;
      }
      // Create mode: stage attachments, upload them to the new card after creation.
      const created = await createOpportunityCard(buildPayload(sources, []));
      const finalAssets: OpportunityAsset[] = [];
      for (const f of pendingPdf) {
        const up = await uploadOpportunityCardAsset(created.id, f);
        finalAssets.push({ id: up.id, name: up.name, kind: "pdf", contentType: up.contentType, sizeBytes: up.sizeBytes });
      }
      for (const l of pendingLinks) {
        const up = await addOpportunityCardAssetLink(created.id, l.url);
        finalAssets.push({ id: up.id, name: up.name, kind: "link", url: up.url });
      }
      const saved = finalAssets.length
        ? await updateOpportunityCard(created.id, buildPayload(sources, finalAssets))
        : created;
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
      setBusy(false);
    }
  };

  const selectCls =
    "flex h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="oc-title">Opportunity title <span className="text-brand-teal">*</span></Label>
          <Input
            id="oc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Saudi Arabia retail distribution"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="oc-territory">Target country / territory <span className="text-brand-teal">*</span></Label>
          <select id="oc-territory" value={territory} onChange={(e) => setTerritory(e.target.value)} className={selectCls}>
            <option value="">Select a country or territory</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="oc-partner">Partner type <span className="text-brand-teal">*</span></Label>
          <select id="oc-partner" value={partner} onChange={(e) => setPartner(e.target.value)} className={selectCls}>
            <option value="">Select a partner type</option>
            {PARTNER_TYPES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Target sales channels</Label>
          <p className="text-xs text-brand-muted">Select all that apply.</p>
          <div className="flex flex-wrap gap-2">
            {OPP_CHANNELS.map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-line px-2.5 py-1.5 text-xs text-brand-ink"
              >
                <input
                  type="checkbox"
                  checked={channels.includes(c)}
                  onChange={() => toggleChannel(c)}
                  className="accent-brand-teal"
                />
                {c}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="oc-timing">Target launch / timing</Label>
          <Input
            id="oc-timing"
            value={timing}
            onChange={(e) => setTiming(e.target.value)}
            placeholder="e.g. Within six months"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="oc-status">Card status</Label>
          <select id="oc-status" value={status} onChange={(e) => setStatus(e.target.value as CardStatusLabel)} className={selectCls}>
            {CARD_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="oc-objective">Commercial objective</Label>
          <Textarea
            id="oc-objective"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. Find a distributor to launch our brand in modern retail."
          />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-brand-line bg-brand-bg-alt/40 p-4">
        <p className="text-sm font-semibold text-brand-ink">
          Catalogue / product reference <span className="text-brand-teal">*</span>
        </p>
        <p className="text-xs text-brand-muted">
          Choose at least one PDF or link already attached to your manufacturer profile.
        </p>
        {profileFiles.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-brand-muted">
              Attach a catalogue in Products &amp; Operations before saving this card.
            </p>
            {onGoToCatalogue && (
              <Button type="button" variant="outline" size="sm" onClick={onGoToCatalogue}>
                Go to catalogue →
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {profileFiles.map((f) => (
              <label
                key={f.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink"
              >
                <input
                  type="checkbox"
                  checked={selectedSources.includes(f.id)}
                  onChange={() => toggleSource(f.id)}
                  className="mt-0.5 accent-brand-teal"
                />
                <span className="min-w-0">
                  <span className="block truncate">{f.originalName}</span>
                  <span className="text-[11px] uppercase tracking-wide text-brand-muted">
                    {f.kind === "link" ? "Catalogue link" : "PDF attachment"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-brand-line bg-brand-bg-alt/40 p-4">
        <div>
          <p className="text-sm font-semibold text-brand-ink">Proposed commercial terms</p>
          <p className="text-xs text-brand-muted">
            These terms apply to this opportunity. They do not replace the company's general operating information.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="oc-moq">Initial order / MOQ</Label>
            <Input id="oc-moq" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="Quantity and unit; e.g. a 400-case trial" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-payment">Payment terms</Label>
            <Input id="oc-payment" value={payment} onChange={(e) => setPayment(e.target.value)} placeholder="e.g. Advance payment; open to discussion" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-delivery">Delivery terms / dispatch location</Label>
            <Input id="oc-delivery" value={delivery} onChange={(e) => setDelivery(e.target.value)} placeholder="e.g. FCA Kyiv; final terms to be agreed" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-rights">Distribution rights / exclusivity</Label>
            <Input id="oc-rights" value={rights} onChange={(e) => setRights(e.target.value)} placeholder="e.g. Non-exclusive initially" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-valid">Proposed terms valid until</Label>
            <Input id="oc-valid" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-support">Marketing / launch support</Label>
            <Input id="oc-support" value={support} onChange={(e) => setSupport(e.target.value)} placeholder="Support proposed for this opportunity" />
          </div>
        </div>

        <div className="space-y-2 border-t border-brand-line pt-4">
          <Label>Opportunity-specific price list / terms <span className="text-[11px] font-normal text-brand-muted">(PDF or link)</span></Label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-lg border border-brand-line bg-white px-3 py-1.5 text-xs font-medium text-brand-ink hover:bg-brand-bg-alt">
              {busy ? "Uploading…" : "↑ Attach a PDF"}
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                disabled={busy || isEdit === false}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (isEdit) await attachPdfLive(f);
                  else setPendingPdf((p) => [...p, f]);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="flex items-center gap-1">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://… price list or commercial terms"
                className="h-9 w-64 rounded-lg border border-brand-line bg-white px-2 text-sm text-brand-ink outline-none focus:border-brand-teal"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!linkUrl.trim() || busy}
                onClick={async () => {
                  if (isEdit) await attachLinkLive();
                  else if (linkUrl.trim()) {
                    try {
                      new URL(linkUrl.trim());
                      setPendingLinks((p) => [...p, { url: linkUrl.trim() }]);
                      setLinkUrl("");
                    } catch {
                      setError("Enter a complete http:// or https:// link.");
                    }
                  }
                }}
              >
                Add link
              </Button>
            </div>
          </div>
          {(assets.length > 0 || pendingPdf.length > 0 || pendingLinks.length > 0) && (
            <ul className="divide-y divide-brand-line rounded-lg border border-brand-line">
              {assets.map((a, i) => (
                <li key={`a-${i}`} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-brand-ink">{a.name}</p>
                    <p className="text-[11px] uppercase tracking-wide text-brand-muted">
                      {a.kind === "link" ? "Terms link" : "PDF attachment"}
                    </p>
                  </div>
                  <button
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => removeAsset(i)}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {!isEdit &&
                pendingPdf.map((f, i) => (
                  <li key={`p-${i}`} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-brand-ink">{f.name}</p>
                      <p className="text-[11px] uppercase tracking-wide text-brand-muted">PDF attachment (saved with card)</p>
                    </div>
                    <button
                      className="text-xs font-medium text-red-600 hover:underline"
                      onClick={() => setPendingPdf((p) => p.filter((_, j) => j !== i))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              {!isEdit &&
                pendingLinks.map((l, i) => (
                  <li key={`l-${i}`} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-brand-ink">{l.url}</p>
                      <p className="text-[11px] uppercase tracking-wide text-brand-muted">Terms link (saved with card)</p>
                    </div>
                    <button
                      className="text-xs font-medium text-red-600 hover:underline"
                      onClick={() => setPendingLinks((p) => p.filter((_, j) => j !== i))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
            </ul>
          )}
          {!isEdit && (
            <p className="text-[11px] text-brand-muted">
              Files and links are uploaded and attached when you save the card.
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Saving…" : initial ? "Save changes" : `Save ${noun}`}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
