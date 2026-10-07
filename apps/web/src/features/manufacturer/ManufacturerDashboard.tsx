import DashboardLayout from "../dashboard/DashboardLayout";
import ManufacturerProfileForm from "./ManufacturerProfileForm";
import OpportunityCardsPanel from "../dashboard/OpportunityCardsPanel";
import MatchSuggestionsPanel from "../dashboard/MatchSuggestionsPanel";
import MarketBrowser from "../dashboard/MarketBrowser";

export default function ManufacturerDashboard() {
  return (
    <DashboardLayout title="Manufacturer workspace">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-brand-ink">Your manufacturer workspace</h1>
          <p className="text-sm text-brand-muted">
            Complete your company profile, share opportunity cards, and get matched with buyers.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ManufacturerProfileForm />
          <OpportunityCardsPanel
            noun="opportunity"
            emptyHint="No opportunity cards yet. Create one to start getting matched with buyers."
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <MatchSuggestionsPanel oppositeNoun="Buyer" />
          <MarketBrowser
            oppositeNoun="Buyer sourcing need"
            emptyHint="No buyer sourcing needs published yet."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
