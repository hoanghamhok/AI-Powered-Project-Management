import { Routes, Route } from "react-router-dom";
import AuthPage from "./features/auth/pages/AuthPage";
import HomePage from "./features/homepage/pages/HomePage";
import ForgotPassword from "./features/auth/pages/ForgotPasswordPage";
import ResetPassword from "./features/auth/pages/ResetPassword";
import ProjectDetailPage from "./features/projects/pages/ProjectDetailPage";
import DashboardLayout from "./features/shared/layout/DashboardLayout";
import GoogleCallback from "./features/auth/pages/Callback";
import { Toaster } from "react-hot-toast";
import { AdminLayout } from "./features/admin/layouts/AdminLayout";
import { AdminDashboard } from "./features/admin/pages/AdminDashboard";
import { UserManagement } from "./features/admin/pages/UserManagement";
import ProtectedAdminRoute from "./features/auth/components/ProtectedAdminRoute";
import { ProfilePage } from "./features/auth/pages/ProfilePage";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route element={<DashboardLayout />}>
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

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
