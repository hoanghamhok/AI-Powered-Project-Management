import { Link } from "react-router-dom";
import { RemoveProject } from "./DeleteProject";
import { useTask } from "../../tasks/hooks/useTasks";
import { useProjectMembers } from "../../members/hooks/useProjectMembers";
import { useGenerateSummary } from "../hooks/useGenerateSummary";
import { useState, useEffect } from "react";
import { Loader2, Wand2, X } from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";

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
  const user = useAuth((s) => s.user);

  const [summary, setSummary] = useState<string | null>(null);
  const [showSummaryOverlay, setShowSummaryOverlay] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    setSummary((project as any).summary || null);
  }, [project]);

  const handleGenerateSummary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.isPremium) return;
    setSummaryError(null);
    generateSummary(project.id, {
      onSuccess: (data: any) => { setSummary(data); setSummaryError(null); },
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

  const status =
    overdueTasks > 0 ? "Delayed" : progress >= 80 ? "Healthy" : progress >= 40 ? "In Progress" : "At Risk";

  const statusStyles = {
    Healthy:     { pill: "bg-green-50 text-green-700",  dot: "bg-green-500"  },
    "In Progress": { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
    "At Risk":   { pill: "bg-red-50 text-red-600",      dot: "bg-red-500"    },
    Delayed:     { pill: "bg-red-50 text-red-600",      dot: "bg-red-500"    },
  }[status];

  const accentColors = ["bg-indigo-500", "bg-pink-500", "bg-teal-500", "bg-violet-500"];
  const accent = accentColors[project.id.length % accentColors.length];

  const memberAvatars = members.map((m: any) => ({
    id: m.userId,
    name: m.user?.username || "Unknown",
    avatar: m.user?.avatarUrl,
  }));

  return (
    <>
      {/* ─── Card ─────────────────────────────────────────────────────── */}
      <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden
                      hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

        {/* Top accent strip */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />

        <div className="p-5 pt-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center
                            text-white font-semibold text-sm shrink-0`}>
              {project.name.charAt(0).toUpperCase()}
            </div>
            {role === "OWNER" && <RemoveProject projectId={project.id} />}
          </div>

          <Link to={`/projects/${project.id}`} className="block">
            {/* Name + description */}
            <h3 className="font-semibold text-gray-900 text-[15px] leading-snug mb-1">
              {project.name}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">
              {project.description || "No description"}
            </p>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-gray-400">Progress</span>
                <span className="text-[11px] font-semibold text-gray-700 tabular-nums">{progress}%</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${accent} rounded-full transition-all duration-500`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              {/* Avatars */}
              <div className="flex -space-x-1.5">
                {memberAvatars.slice(0, 3).map((m: any) => (
                  <div
                    key={m.id}
                    title={m.name}
                    className="w-6 h-6 rounded-full border-2 border-white bg-gray-100
                               flex items-center justify-center text-[9px] font-semibold
                               text-gray-500 overflow-hidden"
                  >
                    {m.avatar
                      ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                      : m.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {memberAvatars.length > 3 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100
                                  flex items-center justify-center text-[9px] font-semibold text-gray-400">
                    +{memberAvatars.length - 3}
                  </div>
                )}
              </div>

              {/* Status pill */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                text-[11px] font-semibold ${statusStyles.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`} />
                {status}
              </span>
            </div>
          </Link>

          {/* Summary button */}
          <button
            onClick={(e) => { e.preventDefault(); setShowSummaryOverlay(true); setSummaryError(null); }}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl
                       bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold
                       hover:opacity-90 active:scale-[0.98] transition-all duration-150"
          >
            <Wand2 className="w-3.5 h-3.5" />
            View AI Summary
          </button>
        </div>
      </div>

      {/* ─── Modal ────────────────────────────────────────────────────── */}
      {showSummaryOverlay && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowSummaryOverlay(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden
                       animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center
                              text-white font-bold text-sm shrink-0`}>
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">
                  Project summary
                </p>
                <h4 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h4>
              </div>
              <button
                onClick={() => setShowSummaryOverlay(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400
                           hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {!user?.isPremium ? (
                /* Upsell */
                <div className="bg-indigo-50 rounded-2xl p-6 text-center border border-indigo-100">
                  <div className="text-3xl mb-3">✨</div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Tóm tắt bằng AI</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                    Chỉ dành cho thành viên Premium.
                  </p>
                  <button
                    onClick={() => (window.location.href = "/premium")}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold
                               hover:bg-indigo-700 transition-colors"
                  >
                    Nâng cấp Premium ngay
                  </button>
                </div>
              ) : (
                <>
                  {/* AI summary block */}
                  <div className="bg-violet-50/60 border border-violet-100 rounded-xl p-4 min-h-[80px]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Wand2 className="w-3 h-3 text-violet-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-violet-500">
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
                      <p className="text-xs text-violet-300 italic leading-relaxed">
                        {project.description || "Nhấn bên dưới để tạo tóm tắt AI."}
                      </p>
                    )}
                  </div>

                  {/* Generate button */}
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                               bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold
                               transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tạo...</>
                      : <><Wand2 className="w-3.5 h-3.5" />
                          {summaryError ? "Thử lại" : summary ? "Tạo lại" : "Tạo tóm tắt AI"}</>
                    }
                  </button>
                </>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Tasks", value: completedTasks, suffix: `/${totalTasks}`, sub: "completed" },
                  { label: "Members", value: members.length, sub: "active" },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 font-medium mb-1">{s.label}</p>
                    <p className="text-[18px] font-semibold text-gray-900 leading-none tabular-nums">
                      {s.value}
                      {s.suffix && <span className="text-xs font-normal text-gray-400">{s.suffix}</span>}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">{s.sub}</p>
                  </div>
                ))}

                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 font-medium mb-1">Status</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyles.dot}`} />
                    <p className={`text-xs font-semibold ${statusStyles.pill.split(" ")[1]}`}>{status}</p>
                  </div>
                </div>

                <div className={`rounded-xl p-3 ${overdueTasks > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                  <p className={`text-[10px] font-medium mb-1 ${overdueTasks > 0 ? "text-red-400" : "text-gray-400"}`}>
                    Overdue
                  </p>
                  <p className={`text-[18px] font-semibold leading-none tabular-nums ${overdueTasks > 0 ? "text-red-600" : "text-gray-900"}`}>
                    {overdueTasks}
                  </p>
                  <p className={`text-[10px] mt-1 ${overdueTasks > 0 ? "text-red-400" : "text-gray-400"}`}>tasks</p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-gray-400">Progress</span>
                  <span className="text-[10px] font-semibold text-gray-600 tabular-nums">{progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${accent} rounded-full transition-all duration-500`}
                       style={{ width: `${progress}%` }} />
                </div>
              </div>

              <button
                onClick={() => setShowSummaryOverlay(false)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs
                           font-semibold hover:bg-gray-50 transition-colors"
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