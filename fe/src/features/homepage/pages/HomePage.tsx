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
  
  // Giới hạn hiển thị 3 projects
  const displayedProjects = projects?.slice(0, 3) || [];
  const hasMoreProjects = (projects?.length || 0) > 3;

  return (
    <div className="bg-[#f7f9fb] min-h-screen">
      <HomeSidebar />
      <main className="ml-64">
        <HomeNavbar />
    
        <section className="w-full px-6 lg:px-10 py-8">

          {/* Welcome */}
          <div className="mb-10">
            <h2 className="text-4xl font-bold mb-2">
              Welcome back, {user?.fullName || "User"}
            </h2>
            <p className="text-gray-500">
              You have {projects?.length || 0} projects
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl">
              <p className="text-3xl font-bold">{projects?.length || 0}</p>
              <p className="text-sm text-gray-500">Total Projects</p>
            </div>

            <div className="bg-white p-6 rounded-xl">
              <p className="text-3xl font-bold">92%</p>
              <p className="text-sm text-gray-500">On Track</p>
            </div>

            <div className="bg-white p-6 rounded-xl">
              <p className="text-3xl font-bold">3</p>
              <p className="text-sm text-gray-500">Deadlines</p>
            </div>
          </div>

          {/* Projects Section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Your Projects</h3>
              {hasMoreProjects && (
                <Link
                  to="/projects"
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm group"
                >
                  View all projects
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {isLoading && <p>Loading...</p>}
            {isError && <p className="text-red-500">Error loading projects</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayedProjects.map((item) => (
                <ProjectCard key={item.project.id} item={item} />
              ))}
            </div>

            {/* Mobile View All Link */}
            {hasMoreProjects && (
              <div className="mt-6 text-center md:hidden">
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  View all projects ({projects?.length})
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity & Upcoming Events */}
          <DashboardSidebar />
        </section>
      </main>
    </div>
  );
};

export default HomePage;