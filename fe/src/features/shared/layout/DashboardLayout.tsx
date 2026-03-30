import { Outlet } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/ProjectNavbar";
import Sidebar from "../components/ProjectSidebar";
import { useAuth } from "../../auth/hooks/useAuth";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="h-screen flex flex-col bg-[#f7f9fb] dark:bg-slate-900">

      {/* NAVBAR */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden">

        {/* OVERLAY (mobile) */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          />
        )}

        {/* SIDEBAR */}
        <div
          className={`
            fixed lg:static z-30
            h-full w-64
            transform transition-transform duration-300
            bg-white dark:bg-slate-800 border-r dark:border-slate-700
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
          `}
        >
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            activeMenu="dashboard"
          />
        </div>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>

        </main>
      </div>
    </div>
  );
}