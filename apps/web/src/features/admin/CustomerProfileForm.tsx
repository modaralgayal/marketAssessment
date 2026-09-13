import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerProfileSchema, type CustomerProfileInput } from "@mea/shared";
import {
  createCustomerProfile,
  uploadCustomerLogo,
} from "../../lib/api";
import { COUNTRIES } from "../landing/countries";
import Combobox from "./Combobox";
import { PRODUCT_CATEGORIES } from "./productCategories";
import AdminLayout from "./AdminLayout";

const emptyContact = { name: "", position: "", phone: "", email: "" };

export default function CustomerProfileForm() {
  const navigate = useNavigate();
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerProfileInput>({
    resolver: zodResolver(customerProfileSchema),
    defaultValues: {
      companyName: "",
      country: "",
      website: "",
      productCategory: "",
      companyInfo: "",
      contacts: [emptyContact],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "contacts" });

  useEffect(() => {
    if (!logo) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && !f.type.startsWith("image/")) {
      setError("Logo must be an image file.");
      return;
    }
    setError(null);
    setLogo(f);
  };

  const onSubmit = async (data: CustomerProfileInput) => {
    setSaving(true);
    setError(null);
    try {
      const cleaned: CustomerProfileInput = {
        ...data,
        website: data.website?.trim() ? data.website.trim() : undefined,
        productCategory: data.productCategory?.trim() ? data.productCategory.trim() : undefined,
        companyInfo: data.companyInfo?.trim() ? data.companyInfo.trim() : undefined,
      };
      const created = await createCustomerProfile(cleaned);
      if (logo) {
        await uploadCustomerLogo(created.id, logo);
      }
      navigate(`/admin/customers/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer profile");
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded border border-brand-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal";

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-brand-ink">New customer profile</h1>
          <button
            type="button"
            onClick={() => navigate("/admin/customers")}
            className="text-sm text-brand-muted hover:text-brand-teal"
          >
            Cancel
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Logo */}
          <section className="rounded-lg border border-brand-line bg-white p-6">
            <h2 className="mb-3 border-b-2 border-brand-teal pb-2 text-base font-bold text-brand-ink">
              Logo
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded border border-brand-line bg-brand-bg-alt text-xs text-brand-muted">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                ) : (
                  "No logo"
                )}
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onLogoChange}
                  className="block text-sm text-brand-muted file:mr-3 file:rounded file:border-0 file:bg-brand-teal file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-teal-dark"
                />
                <p className="mt-1 text-xs text-brand-muted">Optional. PNG, JPG, WebP, GIF or SVG, up to 5 MB.</p>
              </div>
            </div>
          </section>

          {/* Company */}
          <section className="rounded-lg border border-brand-line bg-white p-6">
            <h2 className="mb-3 border-b-2 border-brand-teal pb-2 text-base font-bold text-brand-ink">
              Company
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-ink">Company name *</label>
                <input className={inputCls} {...register("companyName")} />
                {errors.companyName && (
                  <p className="mt-1 text-xs text-red-600">{errors.companyName.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-ink">Website</label>
                <input className={inputCls} placeholder="https://" {...register("website")} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-ink">Country *</label>
                <select className={inputCls} {...register("country")} defaultValue="">
                  <option value="" disabled>Select a country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.country && (
                  <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-ink">
                  Product category
                </label>
                <Controller
                  control={control}
                  name="productCategory"
                  render={({ field }) => (
                    <Combobox
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={PRODUCT_CATEGORIES}
                      placeholder="Type to search or add a category…"
                    />
                  )}
                />
              </div>
            </div>
          </section>

          {/* Contacts */}
          <section className="rounded-lg border border-brand-line bg-white p-6">
            <h2 className="mb-3 border-b-2 border-brand-teal pb-2 text-base font-bold text-brand-ink">
              Contact person(s)
            </h2>
            <p className="mb-4 text-xs text-brand-muted">
              Add at least one contact. Add as many as you want.
            </p>
            <div className="space-y-4">
              {fields.map((f, i) => (
                <div key={f.id} className="rounded border border-brand-line bg-brand-bg-alt p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-brand-ink">Contact {i + 1}</span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-brand-muted">Name *</label>
                      <input className={inputCls} {...register(`contacts.${i}.name`)} />
                      {errors.contacts?.[i]?.name && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.contacts[i]?.name?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-brand-muted">Position</label>
                      <input className={inputCls} {...register(`contacts.${i}.position`)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-brand-muted">Phone</label>
                      <input className={inputCls} {...register(`contacts.${i}.phone`)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-brand-muted">Email</label>
                      <input className={inputCls} type="email" {...register(`contacts.${i}.email`)} />
                      {errors.contacts?.[i]?.email && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.contacts[i]?.email?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => append(emptyContact)}
              className="mt-4 rounded border border-brand-teal px-3 py-1.5 text-sm font-semibold text-brand-teal hover:bg-brand-teal/10"
            >
              + Add contact person
            </button>
            {typeof errors.contacts?.message === "string" && (
              <p className="mt-2 text-xs text-red-600">{errors.contacts.message}</p>
            )}
          </section>

          {/* Company info */}
          <section className="rounded-lg border border-brand-line bg-white p-6">
            <h2 className="mb-3 border-b-2 border-brand-teal pb-2 text-base font-bold text-brand-ink">
              Information about the company
            </h2>
            <textarea
              rows={4}
              className={`${inputCls} resize-y`}
              placeholder="Background, what they do, relevant context…"
              {...register("companyInfo")}
            />
          </section>

          {/* Data pool */}
          <section className="rounded-lg border border-dashed border-brand-line bg-white p-6">
            <h2 className="mb-3 border-b-2 border-brand-line pb-2 text-base font-bold text-brand-ink">
              Data pool
            </h2>
            <p className="text-sm text-brand-muted">
              In this section — reserved for additional structured data (placeholder for now).
            </p>
          </section>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/customers")}
              className="rounded border border-brand-line px-4 py-2 text-sm font-semibold text-brand-muted hover:border-brand-teal hover:text-brand-teal"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-brand-teal px-5 py-2 text-sm font-semibold text-white hover:bg-brand-teal-dark disabled:opacity-60"
            >
              {saving ? "Saving…" : "Create customer profile"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
