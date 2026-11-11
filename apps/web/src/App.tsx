import { useEffect } from "react";
import { Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import FormPage from "./features/form/FormPage";
import AdminLogin from "./features/admin/AdminLogin";
import DistributorList from "./features/admin/DistributorList";
import DistributorProfile from "./features/admin/DistributorProfile";
import DistributorForm from "./features/admin/DistributorForm";
import CustomerList from "./features/admin/CustomerList";
import CustomerForm from "./features/admin/CustomerForm";
import CustomerProfile from "./features/admin/CustomerProfile";
import CustomerProfileForm from "./features/admin/CustomerProfileForm";
import ProtectedRoute from "./features/admin/ProtectedRoute";
import Signup from "./features/auth/Signup";
import Login from "./features/auth/Login";
import RequireRole from "./features/auth/RequireRole";
import PublicOnlyRoute from "./features/auth/PublicOnlyRoute";
import ResetPassword from "./features/auth/ResetPassword";
import AccessRequests from "./features/admin/AccessRequests";
import AccountsList from "./features/admin/AccountsList";
import ReceivedCards from "./features/admin/ReceivedCards";
import ManufacturerDashboard, {
  ManufacturerOverviewRoute,
  ManufacturerCardsRoute,
} from "./features/manufacturer/ManufacturerDashboard";
import BuyerDashboard, {
  BuyerOverviewRoute,
  BuyerMarketRoute,
} from "./features/buyer/BuyerDashboard";
import AccountSettings from "./features/settings/AccountSettings";
import ConversationsPanel from "./features/conversation/ConversationsPanel";
import BuyerEngagementPanel from "./features/manufacturer/BuyerEngagementPanel";
import SourcingInquiryPanel from "./features/buyer/SourcingInquiryPanel";
import ManufacturerProfileForm from "./features/manufacturer/ManufacturerProfileForm";
import ManufacturerPublicProfile from "./features/manufacturer/ManufacturerPublicProfile";
import BuyerProfileForm from "./features/buyer/BuyerProfileForm";
import BuyerPublicProfile from "./features/buyer/BuyerPublicProfile";
import { MarketingPage } from "./features/marketing/pages";
import { useAuth } from "./lib/auth";
import { setUnauthorizedHandler } from "./lib/api";

function MarketingPageFromSlug() {
  const { slug } = useParams();
  return <MarketingPage route={slug ?? "home"} />;
}

export default function App() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // When any authenticated request returns 401 (expired / invalid token), sign
  // the user out app-wide and return them to the sign-in page instead of
  // surfacing raw "Missing bearer token" errors.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout().finally(() => navigate("/login", { replace: true }));
    });
  }, [logout, navigate]);

  return (
      <Routes>
        {/* Legacy standalone assessment form. Reached only at its own path via a
            form-invite link — there is intentionally NO global invite-lock, so
            /signup and every other route render normally and account-invite
            links are never hijacked into the form. */}
        <Route path="/assessment" element={<FormPage standalone />} />

        {/* Self-service sign-up (invite-gated account creation). */}
        <Route path="/signup" element={<Signup />} />

        {/* Self-service sign-in for existing buyer/manufacturer accounts. */}
        <Route path="/login" element={<Login />} />

        {/* Complete a password reset from the emailed link. */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Buyer & Manufacturer dashboards (separate, role-gated). Tabs are
            real nested routes so the browser Back/Forward moves between them. */}
        <Route
          path="/manufacturer"
          element={
            <RequireRole roles={["MANUFACTURER"]}>
              <ManufacturerDashboard />
            </RequireRole>
          }
        >
          <Route index element={<ManufacturerOverviewRoute />} />
          <Route path="cards" element={<ManufacturerCardsRoute />} />
          <Route path="engagement" element={<BuyerEngagementPanel />} />
          <Route path="conversations" element={<ConversationsPanel />} />
          <Route path="profile" element={<ManufacturerProfileForm />} />
          <Route path="*" element={<Navigate to="/manufacturer" replace />} />
        </Route>
        <Route
          path="/buyer"
          element={
            <RequireRole roles={["BUYER"]}>
              <BuyerDashboard />
            </RequireRole>
          }
        >
          <Route index element={<BuyerOverviewRoute />} />
          <Route path="inquiries" element={<SourcingInquiryPanel />} />
          <Route path="market" element={<BuyerMarketRoute />} />
          <Route path="conversations" element={<ConversationsPanel />} />
          <Route path="profile" element={<BuyerProfileForm />} />
          <Route path="*" element={<Navigate to="/buyer" replace />} />
        </Route>

        {/* Self-service account settings (change password/email, privacy, export, delete). */}
        <Route
          path="/settings"
          element={
            <RequireRole roles={["BUYER", "MANUFACTURER"]}>
              <AccountSettings />
            </RequireRole>
          }
        />

        {/* Admin — kept in the existing app, outside the marketing shell. */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Navigate to="/admin/access-requests" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/distributors"
          element={
            <ProtectedRoute>
              <DistributorList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/distributors/new"
          element={
            <ProtectedRoute>
              <DistributorForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/distributors/:id"
          element={
            <ProtectedRoute>
              <DistributorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/distributors/:id/edit"
          element={
            <ProtectedRoute>
              <DistributorForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute>
              <CustomerList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers/new"
          element={
            <ProtectedRoute>
              <CustomerForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers/new-profile"
          element={
            <ProtectedRoute>
              <CustomerProfileForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers/:id"
          element={
            <ProtectedRoute>
              <CustomerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers/:id/edit"
          element={
            <ProtectedRoute>
              <CustomerForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/access-requests"
          element={
            <ProtectedRoute>
              <AccessRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/accounts"
          element={
            <ProtectedRoute>
              <AccountsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/received-cards"
          element={
            <ProtectedRoute>
              <ReceivedCards />
            </ProtectedRoute>
          }
        />

        {/* Renewed marketing site (HTML prototype port) inside the shared shell.
            Guarded: signed-in account holders are sent to their workspace. */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<MarketingPage route="home" />} />
          <Route path="/for-exporting" element={<MarketingPage route="for-exporting" />} />
          <Route path="/for-sourcing" element={<MarketingPage route="for-sourcing" />} />
          <Route
            path="/for-governments-and-associations"
            element={<MarketingPage route="for-governments-and-associations" />}
          />
          <Route path="/contact" element={<MarketingPage route="contact" />} />
          <Route path="/privacy" element={<MarketingPage route="privacy" />} />
          <Route path="/start-trading" element={<MarketingPage route="start-trading" />} />
          <Route path="/for-manufacturers" element={<MarketingPage route="home-copy" />} />
          <Route path="/insights" element={<MarketingPage route="insights" />} />
          <Route path="/:slug" element={<MarketingPageFromSlug />} />
        </Route>

        {/* Public profile pages (visible to any signed-in account, used from
            opportunity cards + conversations to identify who you're dealing with). */}
        <Route
          path="/manufacturer/:accountId/profile"
          element={
            <RequireRole roles={["BUYER", "MANUFACTURER", "ADMIN"]}>
              <ManufacturerPublicProfile />
            </RequireRole>
          }
        />
        <Route
          path="/buyer/:accountId/profile"
          element={
            <RequireRole roles={["BUYER", "MANUFACTURER", "ADMIN"]}>
              <BuyerPublicProfile />
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}
