import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import HomeNavbar from "../components/HomeNavbar";
import HomeSidebar from "../components/HomeSidebar";
import { useProjectsByUser } from "../../projects/hooks/useProjectsByUser";
import { useAuth } from "../../auth/hooks/useAuth";
import { ProjectCard } from "../../projects/components/ProjectCard";
import { DashboardSidebar } from "../components/DashboardSidebar";

const HomePage = () => {
  const { user } = useAuth();
  const { data: projects, isLoading, isError } = useProjectsByUser();

  const displayedProjects = projects?.slice(0, 3) || [];
  const hasMoreProjects = (projects?.length || 0) > 3;

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
              <p className="text-2xl sm:text-3xl font-bold">92%</p>
              <p className="text-xs sm:text-sm text-gray-500">
                On Track
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl">
              <p className="text-2xl sm:text-3xl font-bold">3</p>
              <p className="text-xs sm:text-sm text-gray-500">
                Deadlines
              </p>
            </div>
          </div>

          {/* Projects */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold">
                Your Projects
              </h3>

              {hasMoreProjects && (
                <Link
                  to="/projects"
                  className="hidden sm:flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm group"
                >
                  View all
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {isLoading && <p>Loading...</p>}
            {isError && (
              <p className="text-red-500">Error loading projects</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {displayedProjects.map((item) => (
                <ProjectCard key={item.project.id} item={item} />
              ))}
            </div>

            {/* Mobile View All */}
            {hasMoreProjects && (
              <div className="mt-6 text-center sm:hidden">
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  View all ({projects?.length})
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar dưới (activity) */}
          <DashboardSidebar />
        </section>
      </main>
    </div>
  );
};  

export default HomePage;