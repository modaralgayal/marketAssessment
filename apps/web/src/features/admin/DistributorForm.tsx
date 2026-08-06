import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { distributorSchema, type DistributorInput, type DataTierTemplate, type DataTierField } from "@mea/shared";
import { fetchDistributor, createDistributor, updateDistributor, fetchDataTierTemplate } from "../../lib/api";
import AdminLayout from "./AdminLayout";

export default function DistributorForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tierTemplate, setTierTemplate] = useState<DataTierTemplate | null>(null);
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string; tier: number }>>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DistributorInput>({
    resolver: zodResolver(distributorSchema),
  });

  // Load tier template and existing distributor data
  useEffect(() => {
    Promise.all([
      fetchDataTierTemplate(),
      isEdit && id ? fetchDistributor(id) : Promise.resolve(null),
    ])
      .then(([template, distributor]) => {
        setTierTemplate(template);

        if (distributor) {
          reset(distributor);

          // Load existing attributes into custom fields if they have values not in the template
          const templateKeys = new Set([
            ...template.tier1.fields.map((f: DataTierField) => f.key),
            ...template.tier2.fields.map((f: DataTierField) => f.key),
            ...template.tier3.fields.map((f: DataTierField) => f.key),
          ]);
          const customTierMap = (distributor.attributes?.["_customFieldTiers"] ?? {}) as Record<string, number>;
          const extra: Array<{ key: string; value: string; tier: number }> = [];
          for (const [k, v] of Object.entries(distributor.attributes ?? {})) {
            if (k === "_customFieldTiers") continue;
            if (!templateKeys.has(k) && typeof v === "string") {
              extra.push({ key: k, value: v, tier: customTierMap[k] ?? 3 });
            }
          }
          if (extra.length > 0) setCustomFields(extra);
        }
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset]);

  // Watch attributes for dynamic rendering
  const attributes = watch("attributes") ?? {};

  const onSubmit = async (data: DistributorInput) => {
    setSaving(true);
    setError(null);
    try {
      // Merge custom fields into attributes
      const mergedAttrs = { ...data.attributes } as Record<string, any>;
      const customTierMap: Record<string, number> = {};
      for (const cf of customFields) {
        if (cf.key.trim()) {
          mergedAttrs[cf.key.trim()] = cf.value.trim();
          customTierMap[cf.key.trim()] = cf.tier;
        }
      }
      if (Object.keys(customTierMap).length > 0) {
        mergedAttrs["_customFieldTiers"] = customTierMap;
      } else {
        delete mergedAttrs["_customFieldTiers"];
      }
      data.attributes = mergedAttrs;

      if (isEdit && id) {
        await updateDistributor(id, data);
      } else {
        await createDistributor(data);
      }
      navigate("/admin/distributors");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save distributor");
    } finally {
      setSaving(false);
    }
  };

  const handleAttrChange = (key: string, value: string) => {
    const current = { ...attributes };
    if (value.trim()) {
      current[key] = value.trim();
    } else {
      delete current[key];
    }
    setValue("attributes", current as any);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: "", value: "", tier: 3 }]);
  };

  const removeCustomField = (index: number) => {
    const updated = customFields.filter((_, i) => i !== index);
    setCustomFields(updated);
  };

  const updateCustomField = (index: number, field: "key" | "value" | "tier", val: string | number) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [field]: val as any };
    setCustomFields(updated);
  };

  const renderField = (field: DataTierField) => {
    const val = (attributes as any)[field.key] ?? "";
    const common = "w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue";

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            value={val}
            onChange={(e) => handleAttrChange(field.key, e.target.value)}
            rows={2}
            className={common}
          />
        );
      case "select":
        return (
          <select
            value={val}
            onChange={(e) => handleAttrChange(field.key, e.target.value)}
            className={common}
          >
            <option value="">—</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={field.type === "url" ? "url" : "text"}
            value={val}
            onChange={(e) => handleAttrChange(field.key, e.target.value)}
            className={common}
          />
        );
    }
  };

  const renderTierSection = (tierNum: number, fields: DataTierField[], label: string) => {
    const filled = fields.filter((f) => {
      const v = (attributes as any)[f.key];
      return v !== undefined && v !== null && v !== "";
    }).length;

    return (
      <div className="mt-6 rounded-lg border border-border bg-gray-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-dark-blue">
            Tier {tierNum} · {label}
          </h3>
          <span className="text-xs text-gray-500">
            {filled}/{fields.length} fields filled
          </span>
        </div>
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all ${
              filled === fields.length
                ? "bg-green-500"
                : filled >= fields.length * 0.7
                ? "bg-mid-blue"
                : "bg-amber-400"
            }`}
            style={{ width: `${fields.length > 0 ? (filled / fields.length) * 100 : 0}%` }}
          />
        </div>
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                {field.label}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-sm text-gray-500">Loading…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-dark-blue">
          {isEdit ? "Edit Distributor" : "Add Distributor"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-border bg-white p-6">
        {/* ── Core Fields ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Company Name *
            </label>
            <input
              {...register("companyName")}
              className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
            />
            {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              City / Region *
            </label>
            <input
              {...register("cityRegion")}
              className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
            />
            {errors.cityRegion && <p className="mt-1 text-xs text-red-600">{errors.cityRegion.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Channel / Type *
            </label>
            <input
              {...register("channelType")}
              placeholder="e.g. Modern Trade, HORECA, Foodservice"
              className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
            />
            {errors.channelType && <p className="mt-1 text-xs text-red-600">{errors.channelType.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Size / Scale
            </label>
            <input
              {...register("sizeScale")}
              placeholder="e.g. Large, Medium, Small"
              className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Website
            </label>
            <input
              {...register("website")}
              placeholder="www.example.com"
              className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Phone
            </label>
            <input
              {...register("phone")}
              placeholder="+971 XX XXX XXXX"
              className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="contact@distributor.com"
              className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Contact Person
            </label>
            <input
              {...register("contactPerson")}
              placeholder="Full name of contact"
              className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Do we know them?
          </label>
          <textarea
            {...register("doWeKnowThem")}
            rows={2}
            placeholder="e.g. Yes, met at Gulfood 2024 — had a good introductory meeting"
            className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
          />
        </div>

        <div className="mt-6">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Status / Last Contact
          </label>
          <textarea
            {...register("statusLastContact")}
            rows={2}
            placeholder="e.g. Active — last contacted Jan 2025"
            className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
          />
        </div>

        <div className="mt-6">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Description (size, channels, operations)
          </label>
          <textarea
            {...register("description")}
            rows={3}
            placeholder="Describe the distributor's size, channels, operations, and any other relevant details"
            className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
          />
        </div>

        {/* ── Dynamic Tier Fields ── */}
        {tierTemplate && (
          <div className="mt-8">
            <h2 className="mb-3 border-b-2 border-mid-blue pb-2 text-base font-bold text-dark-blue">
              Data Quality Tiers
            </h2>
            <p className="mb-4 text-xs text-gray-500">
              Fill in fields to improve the distributor's data tier. Higher tiers produce more accurate matches.
            </p>

            {renderTierSection(1, tierTemplate.tier1.fields, tierTemplate.tier1.label)}
            {renderTierSection(2, tierTemplate.tier2.fields, tierTemplate.tier2.label)}
            {renderTierSection(3, tierTemplate.tier3.fields, tierTemplate.tier3.label)}
          </div>
        )}

        {/* ── Ad-hoc Custom Fields ── */}
        <div className="mt-8">
          <h2 className="mb-3 border-b-2 border-mid-blue pb-2 text-base font-bold text-dark-blue">
            Additional Data
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            Add any valuable information that doesn't fit in the predefined fields above.
          </p>

          {customFields.map((cf, i) => (
            <div key={i} className="mb-3 flex items-start gap-3">
              <div className="flex-1">
                <input
                  value={cf.key}
                  onChange={(e) => updateCustomField(i, "key", e.target.value)}
                  placeholder="Field name (e.g. 'Preferred warehouse location')"
                  className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
                />
              </div>
              <div className="flex-[2]">
                <input
                  value={cf.value}
                  onChange={(e) => updateCustomField(i, "value", e.target.value)}
                  placeholder="Value"
                  className="w-full rounded border border-border px-3 py-2 text-sm outline-none focus:border-mid-blue"
                />
              </div>
              <div className="w-28">
                <select
                  value={cf.tier}
                  onChange={(e) => updateCustomField(i, "tier", Number(e.target.value))}
                  className="w-full rounded border border-border px-2 py-2 text-sm outline-none focus:border-mid-blue"
                >
                  <option value={1}>Tier 1</option>
                  <option value={2}>Tier 2</option>
                  <option value={3}>Tier 3</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeCustomField(i)}
                className="mt-1 text-sm text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addCustomField}
            className="mt-2 rounded border border-dashed border-mid-blue px-4 py-1.5 text-xs font-semibold text-mid-blue hover:bg-pale-blue"
          >
            + Add custom field
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-mid-blue px-6 py-2 text-sm font-semibold text-white hover:bg-dark-blue disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Update Distributor" : "Add Distributor"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/distributors")}
            className="rounded border border-border px-6 py-2 text-sm text-gray-600 hover:bg-light-gray"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}