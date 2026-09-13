import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCustomers, deleteCustomer } from "../../lib/api";
import AdminLayout from "./AdminLayout";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedTabs } from "@/components/ui/tabs";

type Cat = "CUSTOMER" | "POTENTIAL" | "OTHER";

const TABS: Array<{ key: Cat; label: string }> = [
  { key: "CUSTOMER", label: "Customers" },
  { key: "POTENTIAL", label: "Potential Customers" },
  { key: "OTHER", label: "Other" },
];

export default function CustomerList() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<Cat>("CUSTOMER");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteCustomer(id);
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete customer");
    } finally {
      setDeletingId(null);
    }
  };

  const counts: Record<Cat, number> = {
    CUSTOMER: (data ?? []).filter((c) => c.category === "CUSTOMER").length,
    POTENTIAL: (data ?? []).filter((c) => c.category === "POTENTIAL").length,
    OTHER: (data ?? []).filter((c) => c.category === "OTHER").length,
  };

  const items = (data ?? [])
    .filter((c) => c.category === cat)
    .filter((c) => {
      const q = search.toLowerCase();
      return (
        !q ||
        c.companyName.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
      );
    });

  const productCategory = (c: {
    productCategory?: string | null;
    industryCategory?: string | null;
  }) => c.productCategory || c.industryCategory || "—";

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-brand-ink">Manufacturers / Brands</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/customers/new-profile"
            className={buttonVariants({ variant: "default" })}
          >
            + New customer profile
          </Link>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, email, country…"
            className="w-full sm:w-64"
          />
        </div>
      </div>

      <SegmentedTabs
        className="mb-5"
        value={cat}
        onValueChange={setCat}
        items={TABS.map((t) => ({ value: t.key, label: t.label, count: counts[t.key] }))}
      />

      {isLoading && <p className="text-sm text-brand-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load customers.</p>}

      {data && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Product Category</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Onboarded</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      to={`/admin/customers/${c.id}`}
                      className="font-semibold text-brand-teal hover:underline"
                    >
                      {c.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-brand-muted">{c.country}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{productCategory(c)}</Badge>
                  </TableCell>
                  <TableCell className="text-brand-muted">
                    {c.contactFullName}
                    <br />
                    <span className="text-xs text-brand-muted">{c.contactEmail}</span>
                  </TableCell>
                  <TableCell className="text-brand-muted">
                    {new Date(c.onboardingDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      disabled={deletingId === c.id}
                      onClick={() => handleDelete(c.id, c.companyName)}
                    >
                      {deletingId === c.id ? "Deleting…" : "Delete"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-brand-muted">
                    {search ? "No customers match your search." : "No customers yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </AdminLayout>
  );
}
