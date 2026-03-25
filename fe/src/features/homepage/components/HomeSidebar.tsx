// home/components/HomeSidebar.tsx
import { NavLink } from "react-router-dom";
import { NewProjectModal } from "../../projects/components/NewProjectModal";
import { useState } from "react";
import { 
  FaTh, 
  FaFolderOpen, 
  FaTasks, 
  FaCog,
  FaPlus,
  FaPencilRuler
} from "react-icons/fa";

const navItemBase =
  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200";

const navItemActive =
  "bg-white font-bold text-[#3525cd] shadow-sm";

const navItemInactive =
  "text-slate-500 hover:text-[#3525cd] hover:bg-white/60";

const HomeSidebar = () => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 z-50 bg-[#f2f4f6] flex flex-col py-8 px-6">
      {/* Logo */}
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2 mb-1">
          <FaPencilRuler className="text-[#3525cd] text-lg" />
          <h1 className="font-bold text-[#3525cd] text-xl">Architect</h1>
        </div>
        <p className="text-xs text-slate-500 uppercase mt-1">
          Design Studio
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
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
          }
        >
          <FaCog className="text-base" />
          <span>Settings</span>
        </NavLink>
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