import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  fetchSourcingInquiries,
  createSourcingInquiry,
  updateSourcingInquiry,
  deleteSourcingInquiry,
  uploadInquiryBrief,
  fetchInquiryBriefUrl,
  type SourcingInquiryDto,
  type SourcingInquiryInput,
  type SourcingInquiryStatus,
} from "../../lib/api";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-brand-bg-alt text-brand-muted",
  OPEN: "bg-brand-teal/10 text-brand-teal",
  PAUSED: "bg-amber-100 text-amber-700",
  CLOSED: "bg-brand-line text-brand-muted",
};

const PRODUCT_TYPES = [
  { value: "BRANDED", label: "Branded" },
  { value: "PRIVATE_LABEL", label: "Private label" },
  { value: "EITHER", label: "Either" },
];

const STATUSES: SourcingInquiryStatus[] = ["DRAFT", "OPEN", "PAUSED", "CLOSED"];

function emptyForm(): SourcingInquiryInput {
  return {
    title: "",
    products: "",
    productType: "EITHER",
    market: undefined,
    channels: [],
    priceTier: undefined,
    targetPrice: undefined,
    timeframe: undefined,
    quantity: undefined,
    essential: undefined,
    negotiable: undefined,
    status: "DRAFT",
  };
}

function InquiryForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: SourcingInquiryDto;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<SourcingInquiryInput>(
    initial
      ? {
          title: initial.title,
          products: initial.products,
          productType: initial.productType,
          market: initial.market ?? undefined,
          channels: initial.channels,
          priceTier: initial.priceTier ?? undefined,
          targetPrice: initial.targetPrice ?? undefined,
          timeframe: initial.timeframe ?? undefined,
          quantity: initial.quantity ?? undefined,
          essential: initial.essential ?? undefined,
          negotiable: initial.negotiable ?? undefined,
          status: initial.status,
        }
      : emptyForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof SourcingInquiryInput>(k: K, v: SourcingInquiryInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: () =>
      initial ? updateSourcingInquiry(initial.id, form) : createSourcingInquiry(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sourcing-inquiries"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      onSaved();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to save."),
  });

  const submit = async () => {
    setError(null);
    if (!form.title.trim() || !form.products.trim()) {
      setError("Title and products are required.");
      return;
    }
    setBusy(true);
    try {
      await save.mutateAsync();
    } finally {
      setBusy(false);
    }
  };

  const field = "space-y-1.5";
  return (
    <div className="space-y-4">
      <div className={field}>
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Private-label olive oil" />
      </div>
      <div className={field}>
        <Label>Products</Label>
        <Textarea value={form.products} onChange={(e) => set("products", e.target.value)} placeholder="Describe the products you need." />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={field}>
          <Label>Product type</Label>
          <select
            value={form.productType}
            onChange={(e) => set("productType", e.target.value as SourcingInquiryInput["productType"])}
            className="flex h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
          >
            {PRODUCT_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className={field}>
          <Label>Target market</Label>
          <Input value={form.market ?? ""} onChange={(e) => set("market", e.target.value || undefined)} placeholder="e.g. UAE, KSA" />
        </div>
        <div className={field}>
          <Label>Channels (comma separated)</Label>
          <Input
            value={form.channels.join(", ")}
            onChange={(e) => set("channels", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            placeholder="Retail, HORECA, Online"
          />
        </div>
        <div className={field}>
          <Label>Status</Label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as SourcingInquiryStatus)}
            className="flex h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className={field}>
          <Label>Price tier</Label>
          <Input value={form.priceTier ?? ""} onChange={(e) => set("priceTier", e.target.value || undefined)} />
        </div>
        <div className={field}>
          <Label>Target price</Label>
          <Input value={form.targetPrice ?? ""} onChange={(e) => set("targetPrice", e.target.value || undefined)} />
        </div>
        <div className={field}>
          <Label>Timeframe</Label>
          <Input value={form.timeframe ?? ""} onChange={(e) => set("timeframe", e.target.value || undefined)} placeholder="e.g. Q3 2026" />
        </div>
        <div className={field}>
          <Label>Quantity / volume</Label>
          <Input value={form.quantity ?? ""} onChange={(e) => set("quantity", e.target.value || undefined)} />
        </div>
      </div>
      <div className={field}>
        <Label>Must-haves</Label>
        <Textarea value={form.essential ?? ""} onChange={(e) => set("essential", e.target.value || undefined)} />
      </div>
      <div className={field}>
        <Label>Open to negotiation</Label>
        <Textarea value={form.negotiable ?? ""} onChange={(e) => set("negotiable", e.target.value || undefined)} />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Saving…" : initial ? "Save changes" : "Create inquiry"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ViewInquiry({ inquiry, onClose }: { inquiry: SourcingInquiryDto; onClose: () => void }) {
  const Row = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-brand-muted">{label}</p>
        <p className="text-sm text-brand-ink whitespace-pre-wrap">{value}</p>
      </div>
    ) : null;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{inquiry.title}</CardTitle>
          <Badge className={STATUS_STYLES[inquiry.status]}>{inquiry.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <p className="text-xs text-brand-muted">
          {inquiry.productType.replace("_", " ")}
          {inquiry.market ? ` · ${inquiry.market}` : ""}
        </p>
        <Row label="Products" value={inquiry.products} />
        <Row label="Channels" value={inquiry.channels.join(", ")} />
        <Row label="Price tier" value={inquiry.priceTier} />
        <Row label="Target price" value={inquiry.targetPrice} />
        <Row label="Timeframe" value={inquiry.timeframe} />
        <Row label="Quantity / volume" value={inquiry.quantity} />
        <Row label="Must-haves" value={inquiry.essential} />
        <Row label="Open to negotiation" value={inquiry.negotiable} />
        {inquiry.briefs.length > 0 && (
          <ul className="space-y-1">
            {inquiry.briefs.map((b) => (
              <li key={b.id}>
                <a
                  onClick={async () => {
                    const { url } = await fetchInquiryBriefUrl(inquiry.id, b.id);
                    window.open(url, "_blank", "noopener");
                  }}
                  className="text-xs font-medium text-brand-teal hover:underline"
                >
                  📎 {b.originalName}
                </a>
              </li>
            ))}
          </ul>
        )}
        <button className="text-xs font-medium text-brand-teal hover:underline" onClick={onClose}>
          Close
        </button>
      </CardContent>
    </Card>
  );
}

const MAX_BRIEFS = 2;

function InquiryCard({ inquiry }: { inquiry: SourcingInquiryDto }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const remove = useMutation({
    mutationFn: () => deleteSourcingInquiry(inquiry.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sourcing-inquiries"] }),
  });
  const upload = useMutation({
    mutationFn: (file: File) => uploadInquiryBrief(inquiry.id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sourcing-inquiries"] }),
  });

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await upload.mutateAsync(file);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit inquiry</CardTitle>
        </CardHeader>
        <CardContent>
          <InquiryForm initial={inquiry} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
        </CardContent>
      </Card>
    );
  }

  if (viewing) {
    return <ViewInquiry inquiry={inquiry} onClose={() => setViewing(false)} />;
  }

  const briefsFull = inquiry.briefs.length >= MAX_BRIEFS;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-brand-ink">{inquiry.title}</p>
            <p className="text-xs text-brand-muted">
              {inquiry.productType.replace("_", " ")}
              {inquiry.market ? ` · ${inquiry.market}` : ""}
            </p>
          </div>
          <Badge className={STATUS_STYLES[inquiry.status]}>{inquiry.status}</Badge>
        </div>
        <p className="line-clamp-2 text-sm text-brand-muted">{inquiry.products}</p>

        {inquiry.briefs.length > 0 && (
          <ul className="space-y-1">
            {inquiry.briefs.map((b) => (
              <li key={b.id}>
                <a
                  onClick={async () => {
                    const { url } = await fetchInquiryBriefUrl(inquiry.id, b.id);
                    window.open(url, "_blank", "noopener");
                  }}
                  className="text-xs font-medium text-brand-teal hover:underline"
                >
                  📎 {b.originalName}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {briefsFull ? (
            <span className="text-xs text-brand-muted">Max {MAX_BRIEFS} briefs</span>
          ) : (
            <label className="cursor-pointer text-xs font-medium text-brand-teal hover:underline">
              {uploading ? "Uploading…" : "＋ Attach brief"}
              <input type="file" className="hidden" onChange={onFile} disabled={uploading} />
            </label>
          )}
          <span className="text-brand-line">·</span>
          <button className="text-xs font-medium text-brand-teal hover:underline" onClick={() => setViewing(true)}>
            View
          </button>
          <span className="text-brand-line">·</span>
          <button className="text-xs font-medium text-brand-teal hover:underline" onClick={() => setEditing(true)}>
            Edit
          </button>
          <span className="text-brand-line">·</span>
          <button
            className="text-xs font-medium text-red-600 hover:underline"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
          >
            Delete
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SourcingInquiryPanel() {
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["sourcing-inquiries"],
    queryFn: fetchSourcingInquiries,
  });

  const filtered = inquiries.filter((i) => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-brand-ink">Sourcing inquiries</h2>
          <p className="text-sm text-brand-muted">Your buying briefs shared with the marketplace.</p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)} disabled={creating}>
          New inquiry
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search inquiries…"
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>New sourcing inquiry</CardTitle>
          </CardHeader>
          <CardContent>
            <InquiryForm onSaved={() => setCreating(false)} onCancel={() => setCreating(false)} />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-brand-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-brand-muted">No inquiries match your filters.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((i) => (
            <InquiryCard key={i.id} inquiry={i} />
          ))}
        </div>
      )}
    </div>
  );
}
