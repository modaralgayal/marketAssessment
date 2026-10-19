import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout, { type NavItem } from "../dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { fetchSourcingInquiries, fetchBuyerProfile, type BuyerProfileDto } from "../../lib/api";
import BuyerOverview from "./BuyerOverview";
import SourcingInquiryPanel from "./SourcingInquiryPanel";
import MarketOffersPanel from "./MarketOffersPanel";
import BuyerProfileForm from "./BuyerProfileForm";

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

function ComingSoon({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-brand-muted">
          Conversations and proposals between buyers and manufacturers are coming in the next release.
          For now you can save and express interest in manufacturer offers from the Opportunity cards tab.
        </p>
      </CardContent>
    </Card>
  );
}

export default function BuyerDashboard() {
  const [view, setView] = useState("overview");
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
      active={view}
      onSelect={setView}
      completion={completion}
    >
      {view === "overview" && <BuyerOverview onGoTo={setView} />}
      {view === "inquiries" && <SourcingInquiryPanel />}
      {view === "market" && <MarketOffersPanel />}
      {view === "conversations" && <ComingSoon title="Conversations" />}
      {view === "profile" && <BuyerProfileForm />}
    </DashboardLayout>
  );
}
