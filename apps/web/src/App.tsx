import { useEffect } from "react";
import { Routes, Route, Navigate, useSearchParams, useParams } from "react-router-dom";
import FormPage from "./features/form/FormPage";
import AdminLogin from "./features/admin/AdminLogin";
import AdminList from "./features/admin/AdminList";
import AdminDetail from "./features/admin/AdminDetail";
import DistributorList from "./features/admin/DistributorList";
import DistributorProfile from "./features/admin/DistributorProfile";
import DistributorForm from "./features/admin/DistributorForm";
import CustomerList from "./features/admin/CustomerList";
import CustomerForm from "./features/admin/CustomerForm";
import CustomerProfile from "./features/admin/CustomerProfile";
import CustomerProfileForm from "./features/admin/CustomerProfileForm";
import LeadList from "./features/admin/LeadList";
import LeadDetail from "./features/admin/LeadDetail";
import ProtectedRoute from "./features/admin/ProtectedRoute";
import { ExportLeadProvider } from "./features/landing/StartExportingModal";
import { MarketingLayout } from "./features/marketing/MarketingLayout";
import { MarketingPage } from "./features/marketing/pages";

/**
 * When the app is reached through an invite link we render an isolated,
 * navigation-locked version of the form: the visitor can only see and submit
 * the form — no site nav, no route to the rest of the site. The lock is sticky
 * for the tab session (sessionStorage) so stripping `?invite=` from the URL
 * doesn't unlock it.
 *
 * Later, isolation moves to a dedicated form subdomain: when served from
 * VITE_FORM_HOST the app is form-only by default (no invite param required).
 */
const FORM_HOST = (import.meta.env as Record<string, string | undefined>).VITE_FORM_HOST;

function MarketingPageFromSlug() {
  const { slug } = useParams();
  return <MarketingPage route={slug ?? "home"} />;
}

export default function App() {
  const [params] = useSearchParams();
  const inviteParam = params.get("invite");

  const isFormHost =
    !!FORM_HOST && typeof window !== "undefined" && window.location.hostname === FORM_HOST;

  const lockedToken =
    inviteParam ||
    (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("mea_form_invite") : null);

  useEffect(() => {
    if (inviteParam) sessionStorage.setItem("mea_form_invite", inviteParam);
  }, [inviteParam]);

  if (lockedToken || isFormHost) {
    return (
      <ExportLeadProvider>
        <Routes>
          <Route path="*" element={<FormPage standalone />} />
        </Routes>
      </ExportLeadProvider>
    );
  }

  return (
    <ExportLeadProvider>
      <Routes>
        {/* Assessment (invite-gated) — kept in the existing app, outside the marketing shell. */}
        <Route path="/assessment" element={<FormPage />} />

        {/* Admin — kept in the existing app, outside the marketing shell. */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/submissions/:id"
          element={
            <ProtectedRoute>
              <AdminDetail />
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

        {/* Renewed marketing-site leads — kept separate from assessment submissions. */}
        <Route
          path="/admin/leads"
          element={
            <ProtectedRoute>
              <LeadList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leads/:id"
          element={
            <ProtectedRoute>
              <LeadDetail />
            </ProtectedRoute>
          }
        />

        {/* Renewed marketing site (HTML prototype port) inside the shared shell. */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<MarketingPage route="home" />} />
          <Route path="/for-exporting" element={<MarketingPage route="for-exporting" />} />
          <Route path="/for-sourcing" element={<MarketingPage route="for-sourcing" />} />
          <Route
            path="/for-governments-and-associations"
            element={<MarketingPage route="for-governments-and-associations" />}
          />
          <Route path="/request-report" element={<MarketingPage route="request-report" />} />
          <Route path="/contact" element={<MarketingPage route="contact" />} />
          <Route path="/privacy" element={<MarketingPage route="privacy" />} />
          <Route path="/start-trading" element={<MarketingPage route="start-trading" />} />
          <Route path="/for-manufacturers" element={<MarketingPage route="home-copy" />} />
          <Route path="/insights" element={<MarketingPage route="insights" />} />
          <Route path="/:slug" element={<MarketingPageFromSlug />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ExportLeadProvider>
  );
}
