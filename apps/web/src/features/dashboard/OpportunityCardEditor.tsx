import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  createOpportunityCard,
  updateOpportunityCard,
  type OpportunityCardDto,
} from "../../lib/api";

interface Props {
  initial?: OpportunityCardDto;
  /** Shown in the heading + button, e.g. "opportunity" or "sourcing need". */
  noun: string;
  onSaved: (card: OpportunityCardDto) => void;
  onCancel: () => void;
}

export default function OpportunityCardEditor({ initial, noun, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [channels, setChannels] = useState<string[]>(initial?.channels ?? []);
  const attr = (initial?.attributes ?? {}) as Record<string, string>;
  const [moq, setMoq] = useState(attr.moq ?? "");
  const [leadTime, setLeadTime] = useState(attr.leadTime ?? "");
  const [price, setPrice] = useState(attr.price ?? "");
  const [paymentTerms, setPaymentTerms] = useState(attr.paymentTerms ?? "");
  const [packaging, setPackaging] = useState(attr.packaging ?? "");
  const [certifications, setCertifications] = useState(attr.certifications ?? "");
  const [notes, setNotes] = useState(attr.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    let attributes: Record<string, unknown> = {};
    if (moq.trim()) attributes.moq = moq.trim();
    if (leadTime.trim()) attributes.leadTime = leadTime.trim();
    if (price.trim()) attributes.price = price.trim();
    if (paymentTerms.trim()) attributes.paymentTerms = paymentTerms.trim();
    if (packaging.trim()) attributes.packaging = packaging.trim();
    if (certifications.trim()) attributes.certifications = certifications.trim();
    if (notes.trim()) attributes.notes = notes.trim();
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        category: category.trim() || undefined,
        summary: summary.trim() || undefined,
        attributes,
        channels,
      };
      const saved = initial
        ? await updateOpportunityCard(initial.id, payload)
        : await createOpportunityCard(payload);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="oc-title">Title</Label>
        <Input
          id="oc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`e.g. ${noun === "sourcing need" ? "Looking for olive oil supplier" : "Premium confectionery line"}`}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="oc-category">Category</Label>
        <Input
          id="oc-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Beverages, Snacks, Packaging"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="oc-channels">Channels</Label>
        <Input
          id="oc-channels"
          value={channels.join(", ")}
          onChange={(e) => setChannels(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="e.g. Retail, HORECA, Online"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="oc-summary">Summary</Label>
        <Textarea
          id="oc-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Describe what you're offering or looking for."
        />
      </div>

      <div className="space-y-1.5">
        <Label>Card details</Label>
        <p className="text-xs text-brand-muted">
          Structured details about the offer. These help buyers and the matchmaking agent understand it.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="oc-moq">MOQ</Label>
            <Input id="oc-moq" value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="e.g. 500 units" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-lead">Lead time</Label>
            <Input id="oc-lead" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="e.g. 4 weeks" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-price">Price indication</Label>
            <Input id="oc-price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. €2.10 / unit" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-payment">Payment terms</Label>
            <Input id="oc-payment" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. 30% advance" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-packaging">Packaging</Label>
            <Input id="oc-packaging" value={packaging} onChange={(e) => setPackaging(e.target.value)} placeholder="e.g. 12 × 250 g" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oc-certs">Certifications</Label>
            <Input id="oc-certs" value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="e.g. Halal, ISO" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="oc-notes">Notes</Label>
          <Textarea
            id="oc-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else buyers should know."
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Saving…" : initial ? "Save changes" : `Create ${noun}`}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
