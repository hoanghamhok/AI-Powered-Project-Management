import { useEffect, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {getUserProjects} from "../../projects/api/projects.api"
import type {ProjectMember } from "../../projects/types"
import { NewProjectModal } from "../../projects/components/NewProjectModal";
import { UpcomingTasks } from "./UpcomingTasks";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeMenu?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeMenu = "dashboard",
}) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["projects"]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) return;

    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        const res = await getUserProjects();
        setProjectMembers(res.data);
      } catch (error) {
        console.error("Load projects failed:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [authLoading, user?.id]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  return (
    <>
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSuccess={() => {
          if (!user?.id) return;
          const loadProjects = async () => {
            try {
              setLoadingProjects(true);
              const res = await getUserProjects();
              setProjectMembers(res.data);
            } catch (error) {
              console.error("Load projects failed:", error);
            } finally {
              setLoadingProjects(false);
            }
          };
          loadProjects();
        }}
      />
      
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white border-r z-40
          transform transition-transform duration-300
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full flex flex-col">

          {/* HEADER */}
          <div className="p-4 border-b w-">
            <button 
              onClick={() => setIsNewProjectModalOpen(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + New Project
            </button>
          </div>

          {/* MENU */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">

              {/* DASHBOARD */}
              <li>
                <button
                  className={`w-full px-3 py-2 rounded-lg text-left ${
                    activeMenu === "dashboard"
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Dashboard
                </button>
              </li>

              {/* PROJECTS */}
              <li>
                <button
                  onClick={() => toggleMenu("projects")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <span className="font-medium uppercase">Projects</span>
                  <span className="text-xs bg-gray-200 px-2 rounded-full">
                    {projectMembers.length}
                  </span>
                </button>

                {expandedMenus.includes("projects") && (
                  <ul className="ml-4 mt-1 space-y-1">

                    {loadingProjects && (
                      <li className="px-3 py-2 text-sm text-gray-400">
                        Loading projects...
                      </li>
                    )}

                    {!loadingProjects &&
                      projectMembers.map((pm) => (
                        <li key={pm.id}>
                          <button
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                              activeMenu === pm.project.id
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-gray-100"
                            }`}
                            onClick={() => navigate(`/projects/${pm.projectId}`)} 
                          >
                            <div className="flex justify-between items-center">
                              <span>{pm.project.name}</span>
                              {pm.role === "OWNER" && (
                                <span className="text-xs text-red-600 font-medium">
                                  Owner
                                </span>
                              )}
                              {pm.role === "ADMIN" && (
                                <span className="text-xs text-blue-600 font-medium">
                                  Admin
                                </span>
                              )}
                              {pm.role === "MEMBER" && (
                                <span className="text-xs text-gray-600 font-medium">
                                  Member
                                </span>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            </ul>

            {/* UPCOMING TASKS */}
            <UpcomingTasks
              projectIds={projectMembers.map(pm => pm.project.id)}
            />
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
