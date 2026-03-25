import { Link } from "react-router-dom";
import { Trash2Icon } from "lucide-react";
import { RemoveProject } from "./DeleteProject";

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
    // Thêm các field này nếu có trong data
    progress?: number; // 0-100
    status?: "HEALTHY" | "AT_RISK" | "DELAYED";
    members?: Array<{
      id: string;
      name: string;
      avatar?: string;
    }>;
  };
};

interface ProjectCardProps {
  item: ProjectMemberItem;
}

export function ProjectCard({ item }: ProjectCardProps) {
  const { project, role } = item;
  const progress = project.progress ?? 75;
  const status = project.status ?? "HEALTHY";
  const members = project.members ?? [];

  const statusColors = {
    HEALTHY: "text-green-600",
    AT_RISK: "text-yellow-600",
    DELAYED: "text-red-600",
  };

  const statusBgColors = {
    HEALTHY: "bg-green-50",
    AT_RISK: "bg-yellow-50",
    DELAYED: "bg-red-50",
  };

  return (
    <div className="relative bg-white p-5 rounded-xl border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
      {/* Header với icon và delete button */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
          {project.name.charAt(0).toUpperCase()}
        </div>
        
        {role === "OWNER" && (
          <RemoveProject projectId={project.id} />
        )}
      </div>

      <Link to={`/projects/${project.id}`} className="block">
        {/* Project name */}
        <h3 className="font-semibold text-gray-900 text-lg mb-1">
          {project.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {project.description || "No description"}
        </p>

        {/* Progress section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Progress</span>
            <span className="text-xs font-semibold text-gray-900">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer với members và status */}
        <div className="flex items-center justify-between">
          {/* Member avatars */}
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((member, index) => (
              <div
                key={member.id}
                className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 overflow-hidden"
                title={member.name}
              >
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {members.length > 3 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                +{members.length - 3}
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]} ${statusBgColors[status]} flex items-center gap-1.5`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {status}
          </div>
        </div>
      </Link>
    </div>
  );
}