import { Routes, Route, Navigate } from "react-router-dom";
import FormPage from "./features/form/FormPage";
import AdminLogin from "./features/admin/AdminLogin";
import AdminList from "./features/admin/AdminList";
import AdminDetail from "./features/admin/AdminDetail";
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
