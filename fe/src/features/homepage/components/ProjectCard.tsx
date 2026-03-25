import { Link } from "react-router-dom";
import { RemoveProject } from "../../projects/components/DeleteProject";

type ProjectMemberItem = {
  id: string;
  projectId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  project: {
    id: string;
    name: string;
    description: string;
  };
};

interface ProjectCardProps {
  item: ProjectMemberItem;
}

export function ProjectCard({ item }: ProjectCardProps) {
  const { project, role } = item;

  const progress = Math.floor(Math.random() * 100);

  const gradients = [
    "from-indigo-500 to-indigo-600",
    "from-pink-500 to-rose-500",
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-indigo-500",
  ];

  const gradient =
    gradients[project.id.length % gradients.length];

  const status =
    progress > 75 ? "Healthy" : progress > 40 ? "In Progress" : "Delayed";

  const statusColor =
    status === "Healthy"
      ? "text-green-500"
      : status === "In Progress"
      ? "text-yellow-500"
      : "text-red-500";

  return (
    <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      
      {/* Delete button */}
      {role === "OWNER" && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
          <RemoveProject projectId={project.id} />
        </div>
      )}

      <Link to={`/projects/${project.id}`} className="block">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shadow-md`}
          >
            {project.name?.charAt(0).toUpperCase()}
          </div>

          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
            {role}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">
          {project.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-5 line-clamp-2">
          {project.description || "No description"}
        </p>

        {/* Progress */}
        <div className="flex justify-between text-xs mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="font-semibold text-indigo-600">
            {progress}%
          </span>
        </div>

        <div className="w-full h-2 bg-gray-100 rounded-full mb-5 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${gradient}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs">
          <span className={`${statusColor} font-semibold`}>
            ● {status}
          </span>

          <span className="text-gray-400">
            Joined {new Date(item.joinedAt).toLocaleDateString()}
          </span>
        </div>
      </Link>
    </div>
  );
}