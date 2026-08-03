import { Routes, Route, Navigate } from "react-router-dom";
import FormPage from "./features/form/FormPage";
import AdminLogin from "./features/admin/AdminLogin";
import AdminList from "./features/admin/AdminList";
import AdminDetail from "./features/admin/AdminDetail";
import DistributorList from "./features/admin/DistributorList";
import DistributorProfile from "./features/admin/DistributorProfile";
import DistributorForm from "./features/admin/DistributorForm";
import ProtectedRoute from "./features/admin/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FormPage />} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
