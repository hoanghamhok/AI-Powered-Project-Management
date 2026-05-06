import { Routes, Route } from "react-router-dom";
import HomePage from "./features/homepage/pages/HomePage";
import ForgotPassword from "./features/auth/pages/ForgotPasswordPage";
import ResetPassword from "./features/auth/pages/ResetPassword";
import GoogleCallback from "./features/auth/pages/Callback";
import { Toaster } from "react-hot-toast";
import { AdminLayout } from "./features/admin/layouts/AdminLayout";
import { AdminDashboard } from "./features/admin/pages/AdminDashboard";
import { UserManagement } from "./features/admin/pages/UserManagement";
import ProtectedAdminRoute from "./features/auth/components/ProtectedAdminRoute";
import { ProfilePage } from "./features/auth/pages/ProfilePage";
import { PremiumPage } from "./features/auth/pages/PremiumPage";
import { PaymentResultPage } from "./features/auth/pages/PaymentResultPage";
import { useEffect } from "react";
import { useAuth } from "./features/auth/hooks/useAuth";
import ProjectLayout from "./features/shared/layout/ProjectLayout";
import ProjectDetailPage from "./features/projects/pages/ProjectDetailPage";
import ReportPage from "./features/report/page/ReportPage";

function App() {
  const { token, fetchProfile } = useAuth();

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  return (
    <>
      <Toaster position="top-right" />

      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<HomePage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* DASHBOARD */}
        <Route>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/premium" element={<PremiumPage />} />
          <Route path="/payment-result" element={<PaymentResultPage />} />
        </Route>
        <Route path="/report" element={<ReportPage />} />

        {/* PROJECT */}
        <Route path="/projects/:projectId" element={<ProjectLayout />}>
          <Route index element={<ProjectDetailPage />} />
          <Route path="board" element={<ProjectDetailPage />} />
        </Route>

        {/* ADMIN */}
        <Route element={<ProtectedAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;