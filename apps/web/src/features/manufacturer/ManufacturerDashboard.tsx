import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout, { type NavItem } from "../dashboard/DashboardLayout";
import {
  fetchMyOpportunityCards,
  fetchManufacturerProfile,
  type ManufacturerProfileDto,
} from "../../lib/api";
import ManufacturerOverview from "./ManufacturerOverview";
import OpportunityCardsPanel from "../dashboard/OpportunityCardsPanel";

const TABS = ["cards", "engagement", "conversations", "profile"] as const;

function computeCompletion(p: ManufacturerProfileDto): number {
  const checks: boolean[] = [
    Boolean(p.companyName),
    Boolean(p.country),
    Boolean(p.contactEmail),
    Boolean(p.industryCategory),
    Boolean(p.productCategory || p.companyInfo),
    (p.salesChannels?.length ?? 0) > 0,
    Boolean(p.halalCert || p.sfdaStatus),
    Boolean(p.currentGccMarkets?.length),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/** Overview tab — injects cross-tab navigation as a route-aware callback. */
export function ManufacturerOverviewRoute() {
  const nav = useNavigate();
  return (
    <ManufacturerOverview
      onGoTo={(k) => nav(k === "overview" ? "/manufacturer" : `/manufacturer/${k}`)}
    />
  );
}

/** Opportunity-cards tab. */
export function ManufacturerCardsRoute() {
  const nav = useNavigate();
  return (
    <OpportunityCardsPanel
      noun="opportunity"
      emptyHint="No opportunity cards yet. Create one to start getting matched with buyers."
      onViewEngagement={() => nav("/manufacturer/engagement")}
      onGoToCatalogue={() =>
        nav("/manufacturer/profile", { state: { scrollTo: "operations" } })
      }
    />
  );
}

export default function ManufacturerDashboard() {
  const { pathname } = useLocation();
  const seg = pathname.split("/")[2];
  const active = seg && (TABS as readonly string[]).includes(seg) ? seg : "overview";

  const nav = useNavigate();
  const go = (key: string) =>
    nav(key === "overview" ? "/manufacturer" : `/manufacturer/${key}`);

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["my-opportunity-cards"],
    queryFn: () => fetchMyOpportunityCards(),
  });
  const { data: profile } = useQuery({
    queryKey: ["manufacturer-profile"],
    queryFn: () => fetchManufacturerProfile(),
    retry: false,
  });

  const completion = profile ? computeCompletion(profile) : 0;
  const navItems: NavItem[] = [
    { key: "overview", label: "Overview" },
    { key: "cards", label: "Opportunity cards", count: cardsLoading ? undefined : cards.length },
    { key: "engagement", label: "Buyer engagement" },
    { key: "conversations", label: "Conversations" },
    { key: "profile", label: "Company profile" },
  ];

  return (
    <DashboardLayout
      role="MANUFACTURER"
      navItems={navItems}
      active={active}
      onSelect={go}
      completion={completion}
    >
      <Outlet />
    </DashboardLayout>
  );
}
