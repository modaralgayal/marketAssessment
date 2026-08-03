import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { distributorSchema, type DistributorInput } from "@mea/shared";
import { fetchDistributor, createDistributor, updateDistributor } from "../../lib/api";
import AdminLayout from "./AdminLayout";

export default function DistributorForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DistributorInput>({
    resolver: zodResolver(distributorSchema),
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchDistributor(id)
        .then((data) => reset(data))
        .catch(() => setError("Failed to load distributor"))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data: DistributorInput) => {
    setSaving(true);
    setError(null);
    try {
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Company Name */}
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

          {/* City / Region */}
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

          {/* Channel / Type */}
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

          {/* Size / Scale */}
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

          {/* Website */}
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

          {/* Phone */}
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

          {/* Email */}
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

          {/* Contact Person */}
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

        {/* Do we know them? */}
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

        {/* Status / Last Contact */}
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

        {/* Description */}
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