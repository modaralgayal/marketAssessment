import DashboardLayout from "../dashboard/DashboardLayout";
import BuyerProfileForm from "./BuyerProfileForm";
import OpportunityCardsPanel from "../dashboard/OpportunityCardsPanel";
import MatchSuggestionsPanel from "../dashboard/MatchSuggestionsPanel";
import MarketBrowser from "../dashboard/MarketBrowser";

export default function BuyerDashboard() {
  return (
    <DashboardLayout title="Buyer workspace">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-brand-ink">Your buyer workspace</h1>
          <p className="text-sm text-brand-muted">
            Complete your buyer profile, post sourcing needs, and browse manufacturer offerings.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <BuyerProfileForm />
          <OpportunityCardsPanel
            noun="sourcing need"
            emptyHint="No sourcing needs yet. Create one to start getting matched with manufacturers."
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <MatchSuggestionsPanel oppositeNoun="Manufacturer" />
          <MarketBrowser
            oppositeNoun="Manufacturer opportunity"
            emptyHint="No manufacturer opportunities published yet."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
