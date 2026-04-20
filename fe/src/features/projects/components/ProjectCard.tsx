import { Link } from "react-router-dom";
import { RemoveProject } from "./DeleteProject";
import { useTask } from "../../tasks/hooks/useTasks";
import { useProjectMembers } from "../../members/hooks/useProjectMembers";
import { useGenerateSummary } from "../hooks/useGenerateSummary";
import { useState, useEffect } from "react";
import { Loader2, Wand2, X } from "lucide-react";

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
  const { tasks } = useTask(project.id);
  const { data: members = [] } = useProjectMembers(project.id);
  const { mutate: generateSummary, isPending } = useGenerateSummary();
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummaryOverlay, setShowSummaryOverlay] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  useEffect(() => {
    setSummary((project as any).summary || null);
  }, [project]);

  const handleGenerateSummary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSummaryError(null); // Reset error state
    generateSummary(project.id, {
      onSuccess: (data: any) => {
        setSummary(data);
        setSummaryError(null);
      },
      onError: (error: any) => {
        setSummaryError(error?.message || "AI không trả lời được. Vui lòng thử lại.");
      },
    });
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completedAt).length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && !t.completedAt && new Date(t.dueDate) < new Date()
  ).length;

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const status = overdueTasks > 0
    ? "Delayed"
    : progress >= 80
    ? "Healthy"
    : progress >= 40
    ? "In Progress"
    : "At Risk";

  const statusColor =
    status === "Healthy"
      ? "text-green-600"
      : status === "In Progress"
      ? "text-yellow-600"
      : "text-red-600";

  const statusBgColor =
    status === "Healthy"
      ? "bg-green-50"
      : status === "In Progress"
      ? "bg-yellow-50"
      : "bg-red-50";

  const memberAvatars = members.map((m: any) => ({
    id: m.userId,
    name: m.user?.username || "Unknown",
    avatar: m.user?.avatarUrl,
  }));

  const gradients = [
    "from-indigo-500 to-indigo-600",
    "from-pink-500 to-rose-500",
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-indigo-500",
  ];

  const gradient = gradients[project.id.length % gradients.length];

  return (
    <>
      <div className="relative overflow-hidden bg-white p-5 rounded-xl border border-gray-200">
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
              {memberAvatars.slice(0, 3).map((member:any) => (
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
              {memberAvatars.length > 3 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                  +{memberAvatars.length - 3}
                </div>
              )}
            </div>

            {/* Status badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor} ${statusBgColor} flex items-center gap-1.5`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {status}
            </div>
          </div>
        </Link>

        {/* Button to show summary */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowSummaryOverlay(true);
            setSummaryError(null); // Reset error when opening modal
          }}
          className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-medium hover:shadow-md transition"
        >
          <Wand2 className="w-3.5 h-3.5" />
          View Summary
        </button>
      </div>

      {/* Summary Modal */}
      {showSummaryOverlay && (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowSummaryOverlay(false)}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">
                Project summary
              </p>
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {project.name}
              </h4>
            </div>
            <button
              onClick={() => setShowSummaryOverlay(false)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* AI Summary block */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 min-h-[80px]">
              <div className="flex items-center gap-1.5 mb-2">
                <Wand2 className="w-3 h-3 text-violet-500" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-500">
                  AI Summary
                </span>
              </div>

              {isPending ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs">Đang tạo tóm tắt...</span>
                </div>
              ) : summaryError ? (
                <p className="text-xs text-red-500 leading-relaxed">{summaryError}</p>
              ) : summary ? (
                <p className="text-xs text-gray-600 leading-relaxed">{summary}</p>
              ) : (
                <p className="text-xs text-gray-400 leading-relaxed italic">
                  {project.description || "Chưa có mô tả. Nhấn bên dưới để tạo tóm tắt AI."}
                </p>
              )}
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerateSummary}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              {isPending
                ? "Đang tạo..."
                : summaryError
                ? "Thử lại"
                : summary
                ? "Tạo lại"
                : "Tạo tóm tắt AI"}
            </button>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 mb-1">Tasks</p>
                <p className="text-lg font-semibold text-gray-900 leading-none">
                  {completedTasks}
                  <span className="text-xs font-normal text-gray-400">/{totalTasks}</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-1">completed</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 mb-1">Members</p>
                <p className="text-lg font-semibold text-gray-900 leading-none">
                  {members.length}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">active</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 mb-1">Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    status === "Healthy" ? "bg-green-500" :
                    status === "In Progress" ? "bg-yellow-500" : "bg-red-500"
                  }`} />
                  <p className={`text-xs font-medium ${statusColor}`}>{status}</p>
                </div>
              </div>

              <div className={`rounded-xl p-3 ${
                overdueTasks > 0 ? "bg-red-50 border border-red-100" : "bg-gray-50"
              }`}>
                <p className={`text-[10px] mb-1 ${overdueTasks > 0 ? "text-red-400" : "text-gray-400"}`}>
                  Overdue
                </p>
                <p className={`text-lg font-semibold leading-none ${
                  overdueTasks > 0 ? "text-red-600" : "text-gray-900"
                }`}>
                  {overdueTasks}
                </p>
                <p className={`text-[10px] mt-1 ${overdueTasks > 0 ? "text-red-400" : "text-gray-400"}`}>
                  tasks
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-gray-400">Progress</span>
                <span className="text-[10px] font-semibold text-gray-700">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => setShowSummaryOverlay(false)}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}