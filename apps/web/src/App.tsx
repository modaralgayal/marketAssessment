import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./features/landing/LandingPage";
import FormPage from "./features/form/FormPage";
import PrivacyPolicy from "./features/legal/PrivacyPolicy";
import ContactPage from "./features/landing/ContactPage";
import AdminLogin from "./features/admin/AdminLogin";
import AdminList from "./features/admin/AdminList";
import AdminDetail from "./features/admin/AdminDetail";
import DistributorList from "./features/admin/DistributorList";
import DistributorProfile from "./features/admin/DistributorProfile";
import DistributorForm from "./features/admin/DistributorForm";
import CustomerList from "./features/admin/CustomerList";
import CustomerForm from "./features/admin/CustomerForm";
import CustomerProfile from "./features/admin/CustomerProfile";
import ProtectedRoute from "./features/admin/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/assessment" element={<FormPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/contact" element={<ContactPage />} />
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
  );
}
