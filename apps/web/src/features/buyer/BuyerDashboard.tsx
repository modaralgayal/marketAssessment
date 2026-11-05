import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout, { type NavItem } from "../dashboard/DashboardLayout";
import { fetchSourcingInquiries, fetchBuyerProfile, type BuyerProfileDto } from "../../lib/api";
import BuyerOverview from "./BuyerOverview";
import MarketOffersPanel from "./MarketOffersPanel";

const TABS = ["inquiries", "market", "conversations", "profile"] as const;

function computeCompletion(p: BuyerProfileDto): number {
  const checks: boolean[] = [
    Boolean(p.companyName),
    Boolean(p.country),
    Boolean(p.contactEmail),
    Boolean(p.tradingName || p.hqCountry),
    (p.categories?.length ?? 0) > 0,
    Boolean(p.sourcingNeeds),
    Boolean(p.roles?.length),
    Boolean(p.portfolioInfo || p.portfolioProducts),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/** Overview tab — injects cross-tab navigation as a route-aware callback. */
export function BuyerOverviewRoute() {
  const nav = useNavigate();
  return (
    <BuyerOverview onGoTo={(k) => nav(k === "overview" ? "/buyer" : `/buyer/${k}`)} />
  );
}

/** Opportunity-cards (market) tab. */
export function BuyerMarketRoute() {
  const nav = useNavigate();
  return <MarketOffersPanel onExpressInterest={() => nav("/buyer/conversations")} />;
}

export default function BuyerDashboard() {
  const { pathname } = useLocation();
  const seg = pathname.split("/")[2];
  const active = seg && (TABS as readonly string[]).includes(seg) ? seg : "overview";

  const nav = useNavigate();
  const go = (key: string) => nav(key === "overview" ? "/buyer" : `/buyer/${key}`);

  const { data: inquiries = [] } = useQuery({
    queryKey: ["sourcing-inquiries"],
    queryFn: fetchSourcingInquiries,
  });
  const { data: profile } = useQuery({
    queryKey: ["buyer-profile"],
    queryFn: fetchBuyerProfile,
    retry: false,
  });

  const completion = profile ? computeCompletion(profile) : 0;
  const navItems: NavItem[] = [
    { key: "overview", label: "Overview" },
    { key: "inquiries", label: "Sourcing inquiries", count: inquiries.length },
    { key: "market", label: "Opportunity cards" },
    { key: "conversations", label: "Conversations" },
    { key: "profile", label: "Company profile" },
  ];

  return (
    <DashboardLayout
      role="BUYER"
      navItems={navItems}
      active={active}
      onSelect={go}
      completion={completion}
    >
      <Outlet />
    </DashboardLayout>
  );
}
