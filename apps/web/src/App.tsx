import { useEffect } from "react";
import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import LandingPage from "./features/landing/LandingPage";
import FormPage from "./features/form/FormPage";
import PrivacyPolicy from "./features/legal/PrivacyPolicy";
import ContactPage from "./features/landing/ContactPage";
import RequestReportPage from "./features/landing/RequestReportPage";
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
import ProtectedRoute from "./features/admin/ProtectedRoute";
import { ExportLeadProvider } from "./features/landing/StartExportingModal";

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
        <Route path="/" element={<LandingPage />} />
        <Route path="/assessment" element={<FormPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/request-report" element={<RequestReportPage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ExportLeadProvider>
  );
}
