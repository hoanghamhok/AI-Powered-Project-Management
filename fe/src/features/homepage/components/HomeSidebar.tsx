// home/components/HomeSidebar.tsx
import { NavLink } from "react-router-dom";
import { NewProjectModal } from "../../projects/components/NewProjectModal";
import { useState } from "react";
import { 
  FaTh, 
  FaPlus,
  FaPencilRuler,
  FaChartLine
} from "react-icons/fa";

import { useAuth } from "../../auth/hooks/useAuth";
import { useProjectsByUser } from "../../projects/hooks/useProjectsByUser";

const navItemBase =
  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200";

const navItemActive =
  "bg-white font-bold text-[#3525cd] shadow-sm";

const navItemInactive =
  "text-slate-500 hover:text-[#3525cd] hover:bg-white/60";

const HomeSidebar = () => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const { user } = useAuth();
  const { data: projectMembers = [] } = useProjectsByUser();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasReportAccess = isSuperAdmin || projectMembers.some(pm => pm.role === "OWNER" || pm.role === "ADMIN");

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 z-10 bg-[#f2f4f6] flex flex-col py-8 px-6">
      {/* Logo */}
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2 mb-1">
          <FaPencilRuler className="text-[#3525cd] text-lg" />
          <h1 className="font-bold text-[#3525cd] text-xl whitespace-nowrap">PM System</h1>
        </div>
        <p className="text-xs text-slate-500 uppercase mt-1">
          With AI-Powered
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-y-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
          }
        >
          <FaTh className="text-base" />
          <span>Dashboard</span>
        </NavLink>
{/* 
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
          }
        >
          <FaFolderOpen className="text-base" />
          <span>Projects</span>
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
          }
        >
          <FaTasks className="text-base" />
          <span>My Tasks</span>
        </NavLink> */}

        {hasReportAccess && (
          <NavLink
            to="/report"
            className={({ isActive }) =>
              `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
            }
          >
            <FaChartLine className="text-base" />
            <span>Report</span>
          </NavLink>
        )}
      </nav>
      
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />    
      
      {/* CTA */}
      <div className="mt-auto">
        <button 
          className="w-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
          onClick={() => setIsNewProjectModalOpen(true)}
        >
          <FaPlus className="text-sm" />
          <span>Create New Project</span>
        </button>
      </div>
    </aside>
  );
};

export default HomeSidebar;