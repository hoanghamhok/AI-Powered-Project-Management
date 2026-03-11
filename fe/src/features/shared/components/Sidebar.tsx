import { useEffect, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { getUserProjects } from "../../projects/api/projects.api";
import type { ProjectMember } from "../../projects/types";
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

  const [favorites] = useState([
    { id: "backend", name: "Backend Board" },
    { id: "bugs", name: "Bug Tracker" },
  ]);

  const [recent] = useState([
    { id: "task-123", name: "Fix login bug" },
    { id: "task-87", name: "Update API endpoint" },
  ]);

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
        onSuccess={() => window.location.reload()}
      />

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
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
          <div className="p-4 border-b">
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
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
                  onClick={() => navigate("/dashboard")}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm font-medium ${
                    activeMenu === "dashboard"
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  Dashboard
                </button>
              </li>

              {/* QUICK FILTERS */}
              <li className="pt-4">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase">
                  Quick Filters
                </p>

                <ul className="mt-1 space-y-1">
                  <li>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
                      ⭐ My Issues
                    </button>
                  </li>

                  <li>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
                      🔥 High Priority
                    </button>
                  </li>

                  <li>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
                      ⏰ Due Today
                    </button>
                  </li>
                </ul>
              </li>

              {/* PROJECTS */}
              <li className="pt-4">
                <button
                  onClick={() => toggleMenu("projects")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <span className="text-xs font-semibold text-gray-400 uppercase">
                    Projects
                  </span>

                  <span className="text-xs bg-gray-200 px-2 rounded-full">
                    {projectMembers.length}
                  </span>
                </button>

                {expandedMenus.includes("projects") && (
                  <ul className="ml-2 mt-2 space-y-1">

                    {loadingProjects && (
                      <li className="px-3 py-2 text-sm text-gray-400">
                        Loading...
                      </li>
                    )}

                    {!loadingProjects &&
                      projectMembers.map((pm) => (
                        <li key={pm.id}>
                          <button
                            onClick={() =>
                              navigate(`/projects/${pm.projectId}`)
                            }
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                              activeMenu === pm.project.id
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center justify-between">

                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center text-xs">
                                  {pm.project.name.charAt(0)}
                                </div>

                                <span>{pm.project.name}</span>
                              </div>

                              <span className="text-xs text-gray-500">
                                {pm.role}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </li>

              {/* FAVORITES */}
              <li className="pt-4">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase">
                  Favorites
                </p>

                <ul className="mt-1 space-y-1">
                  {favorites.map((fav) => (
                    <li key={fav.id}>
                      <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
                        ⭐ {fav.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>

              {/* RECENT */}
              <li className="pt-4">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase">
                  Recent
                </p>

                <ul className="mt-1 space-y-1">
                  {recent.map((item) => (
                    <li key={item.id}>
                      <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>

            </ul>

            {/* UPCOMING TASKS */}
            <UpcomingTasks
              projectIds={projectMembers.map((pm) => pm.project.id)}
            />

          </nav>

          {/* FOOTER */}
          <div className="p-4 border-t space-y-1">

            <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
              ⚙ Settings
            </button>

            <button className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
              👤 Profile
            </button>

          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;