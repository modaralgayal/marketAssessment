import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout, { type NavItem } from "../dashboard/DashboardLayout";
import {
  fetchMyOpportunityCards,
  fetchManufacturerProfile,
  type ManufacturerProfileDto,
} from "../../lib/api";
import ManufacturerOverview from "./ManufacturerOverview";
import ManufacturerProfileForm from "./ManufacturerProfileForm";
import BuyerEngagementPanel from "./BuyerEngagementPanel";
import OpportunityCardsPanel from "../dashboard/OpportunityCardsPanel";
import ConversationsPanel from "../conversation/ConversationsPanel";

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

export default function ManufacturerDashboard() {
  const [view, setView] = useState("overview");

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
      active={view}
      onSelect={setView}
      completion={completion}
    >
      {view === "overview" && <ManufacturerOverview onGoTo={setView} />}
      {view === "cards" && (
        <OpportunityCardsPanel
          noun="opportunity"
          emptyHint="No opportunity cards yet. Create one to start getting matched with buyers."
          onViewEngagement={() => setView("engagement")}
          onGoToCatalogue={() => {
            setView("profile");
            setTimeout(() => {
              document.getElementById("operations")?.scrollIntoView({ behavior: "smooth" });
            }, 350);
          }}
        />
      )}
      {view === "engagement" && <BuyerEngagementPanel />}
      {view === "conversations" && <ConversationsPanel />}
      {view === "profile" && <ManufacturerProfileForm />}
    </DashboardLayout>
  );
}
