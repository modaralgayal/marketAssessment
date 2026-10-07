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
  const [attributesJson, setAttributesJson] = useState(
    initial?.attributes && Object.keys(initial.attributes).length
      ? JSON.stringify(initial.attributes, null, 2)
      : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    let attributes: Record<string, unknown> = {};
    if (attributesJson.trim()) {
      try {
        const parsed = JSON.parse(attributesJson);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          attributes = parsed as Record<string, unknown>;
        } else {
          setError("Details must be a JSON object, e.g. {\"moq\": \"500 units\"}.");
          return;
        }
      } catch {
        setError("Details is not valid JSON.");
        return;
      }
    }
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        category: category.trim() || undefined,
        summary: summary.trim() || undefined,
        attributes,
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
        <Label htmlFor="oc-summary">Summary</Label>
        <Textarea
          id="oc-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Describe what you're offering or looking for."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="oc-attributes">Details (optional JSON)</Label>
        <Textarea
          id="oc-attributes"
          value={attributesJson}
          onChange={(e) => setAttributesJson(e.target.value)}
          className="font-mono text-xs"
          placeholder={'{\n  "moq": "500 units",\n  "leadTime": "4 weeks"\n}'}
        />
        <p className="text-xs text-brand-muted">Structured attributes the matchmaking agent can use.</p>
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
