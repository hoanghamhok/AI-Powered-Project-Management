import { useMemo, useState } from "react";
import { FolderOpen, Search } from "lucide-react";
import HomeNavbar from "../components/HomeNavbar";
import HomeSidebar from "../components/HomeSidebar";
import { useProjectsByUser } from "../../projects/hooks/useProjectsByUser";
import { useAuth } from "../../auth/hooks/useAuth";
import { ProjectCard } from "../components/ProjectCard";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { useMyTasks } from "../../tasks/hooks/useMyTask";

type ProjectRoleFilter = "ALL" | "OWNER" | "ADMIN" | "MEMBER";

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<ProjectRoleFilter>("ALL");
  const { user } = useAuth();
  const { data: projects, isLoading, isError } = useProjectsByUser();
  const { data: myTasks } = useMyTasks();

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (projects || []).filter((item) => {
      const matchesRole = roleFilter === "ALL" || item.role === roleFilter;
      const matchesSearch =
        !normalizedSearch ||
        item.project.name.toLowerCase().includes(normalizedSearch) ||
        item.project.description?.toLowerCase().includes(normalizedSearch);

      return matchesRole && matchesSearch;
    });
  }, [projects, roleFilter, searchTerm]);

  const currentDate = new Date();
  const onTrackCount = myTasks?.filter(task => 
    !task.completedAt && task.dueDate && new Date(task.dueDate) > currentDate
  ).length || 0;
  const deadlinesCount = myTasks?.filter(task => 
    !task.completedAt && task.dueDate && new Date(task.dueDate) < currentDate
  ).length || 0;

  return (
    <div className="bg-[#f7f9fb] min-h-screen">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <HomeSidebar />
      </div>

      {/* Main */}
      <main className="ml-0 lg:ml-64">
        <HomeNavbar />

        <section className="w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

          {/* Welcome */}
          <div className="mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              Welcome back, {user?.fullName || "User"}
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              You have {projects?.length || 0} projects
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
            <div className="bg-white p-4 sm:p-6 rounded-xl">
              <p className="text-2xl sm:text-3xl font-bold">
                {projects?.length || 0}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Total Projects
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl">
              <p className="text-2xl sm:text-3xl font-bold">{onTrackCount}</p>
              <p className="text-xs sm:text-sm text-gray-500">
                On Track
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl">
              <p className="text-2xl sm:text-3xl font-bold">{deadlinesCount}</p>
              <p className="text-xs sm:text-sm text-gray-500">
                Deadlines
              </p>
            </div>
          </div>

          {/* Projects */}
          <div className="mb-10">
            <div className="flex flex-col gap-4 mb-4 sm:mb-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl sm:text-2xl font-bold">
                    Your Projects
                  </h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Showing {filteredProjects.length} of {projects?.length || 0} projects
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search projects"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div className="flex rounded-xl border border-gray-200 bg-white p-1">
                  {(["ALL", "OWNER", "ADMIN", "MEMBER"] as ProjectRoleFilter[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        roleFilter === role
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                    >
                      {role === "ALL" ? "All" : role}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isLoading && <p>Loading...</p>}
            {isError && (
              <p className="text-red-500">Error loading projects</p>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white/60 p-3 sm:p-4">
              {filteredProjects.length === 0 && !isLoading && !isError ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-center">
                  <FolderOpen className="mb-3 h-8 w-8 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-700">No projects found</p>
                  <p className="mt-1 text-xs text-gray-500">Try another search or role filter.</p>
                </div>
              ) : (
                <div className="max-h-[680px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredProjects.map((item) => (
                      <ProjectCard key={item.project.id} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar dưới (activity) */}
          <DashboardSidebar />
        </section>
      </main>
    </div>
  );
};  

export default HomePage;
