import { useState, useEffect } from "react";
import HomeNavbar from "../../homepage/components/HomeNavbar";
import HomeSidebar from "../../homepage/components/HomeSidebar";
import {
  useProjectStats,
  useMemberPerformance,
  useTaskCompletionTrend,
  useHighRiskTasks,
} from "../hooks/useAnalytics";
import { useProjectsByUser } from "../../projects/hooks/useProjectsByUser";
import { useAuth } from "../../auth/hooks/useAuth";
import { ProjectRecentActivity } from "../../activities/components/ProjectRecentActivity";

// Components
import type { StatCardProps } from "../components/StatCard";
import { StatCard } from "../components/StatCard";
import { AnalyticsHeader } from "../components/AnalyticsHeader";
import { AnalyticsCharts } from "../components/AnalyticsCharts";
import { TeamPerformance } from "../components/TeamPerformance";
import { RiskTasksTable } from "../components/RiskTasksTable";
import type { RiskRowProps } from "../components/RiskRow";

// ─── Constants ────────────────────────────────────────────────────────────────
const PIE_COLORS = ["#004ac6", "#acbfff", "#ba1a1a"];
const shadow = {
  boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
} as const;


const FALLBACK_BAR = [
  { fullName: "Alex M.", completedTasks: 14 },
  { fullName: "Sarah K.", completedTasks: 19 },
  { fullName: "James R.", completedTasks: 9 },
  { fullName: "Elena V.", completedTasks: 21 },
  { fullName: "Marcus L.", completedTasks: 12 },
];

const DATE_OPTIONS = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardContent() {
  const { data: projectMembers = [] } = useProjectsByUser();
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState(30);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const reportableProjects = projectMembers.filter(pm => 
    isSuperAdmin || pm.role === "OWNER" || pm.role === "ADMIN"
  );

  useEffect(() => {
    if (reportableProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(reportableProjects[0].projectId);
    }
  }, [reportableProjects, selectedProjectId]);

  const { data: stats } = useProjectStats(selectedProjectId);
  const { data: memberPerformance = [] } = useMemberPerformance(selectedProjectId);
  const { data: trend = [] } = useTaskCompletionTrend(selectedProjectId, selectedDays);
  const { data: highRiskTasks = [] } = useHighRiskTasks(selectedProjectId);

  // ── Data Formatting ───────────────────────────────────────────────────────
  const lineData = trend.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: item.completed,
  }));

  const pieData = stats
    ? [
      { name: "Done", value: stats.completedTasks },
      { name: "In Progress", value: stats.inProgressTasks },
      { name: "Overdue", value: stats.overdueTasks },
    ]
    : [];

  const barData = memberPerformance.length > 0
    ? memberPerformance.slice(0, 5)
    : FALLBACK_BAR;

  const maxBar = Math.max(...barData.map((b) => b.completedTasks), 1);

  const riskRows: RiskRowProps[] = highRiskTasks.map((task) => {
    const riskScore = task.riskScore;
    let statusLabel = "LOW RISK";
    let statusBg = "bg-emerald-100";
    let statusColor = "text-emerald-700";

    if (riskScore > 0.7) {
      statusLabel = "CRITICAL";
      statusBg = "bg-red-100";
      statusColor = "text-red-600";
    } else if (riskScore > 0.4) {
      statusLabel = "AT RISK";
      statusBg = "bg-amber-100";
      statusColor = "text-amber-700";
    }

    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date();

    const assignees = task.assignees.map((a) => ({
      img: a.user.avatarUrl || `https://ui-avatars.com/api/?name=${a.user.fullName || 'U'}&background=random`,
      name: a.user.fullName || "Unknown",
    }));

    return {
      taskName: task.title,
      category: task.description ? (task.description.length > 40 ? task.description.substring(0, 40) + "..." : task.description) : "No description",
      assignees,
      deadline: dueDate ? dueDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "No deadline",
      deadlineSub: isOverdue ? "Overdue" : (dueDate ? "Ongoing" : "N/A"),
      deadlineColor: isOverdue ? "text-red-500" : "text-gray-800",
      deadlineSubColor: isOverdue ? "text-red-400" : "text-gray-400",
      statusLabel,
      statusBg,
      statusColor,
    };
  });


  // ── Stat Cards Data ───────────────────────────────────────────────────────
  const statCards: StatCardProps[] = stats
    ? [
      {
        iconName: "assignment",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
        badge: "Active",
        badgeClass: "text-gray-400",
        label: "Total Tasks",
        value: stats.totalTasks,
        subIcon: "analytics",
        subText: "Overall project volume",
        subClass: "text-gray-400",
      },
      {
        iconName: "check_circle",
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-500",
        badge: "Closed",
        badgeClass: "text-gray-400",
        label: "Completed",
        value: stats.completedTasks,
        subIcon: "task_alt",
        subText: `${stats.completionRate}% Success Rate`,
        subClass: "text-emerald-500",
      },
      {
        iconName: "pending",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        badge: "Ongoing",
        badgeClass: "text-gray-400",
        label: "In Progress",
        value: stats.inProgressTasks,
        subIcon: "timer",
        subText: `Avg. ${stats.avgCompletionTime} days / task`,
        subClass: "text-amber-600",
      },
      {
        iconName: "warning",
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
        badge: "Critical",
        badgeClass: "text-red-500 font-black",
        label: "Overdue",
        value: stats.overdueTasks,
        valueClass: "text-red-600",
        subIcon: "priority_high",
        subText: stats.overdueTasks > 0 ? "Needs immediate action" : "System healthy",
        subClass: stats.overdueTasks > 0 ? "text-red-500" : "text-emerald-500",
      },
    ]
    : [];

  return (
    <div className="min-h-screen bg-[#f8f9fd] text-gray-900">
      <div className="hidden lg:block">
        <HomeSidebar />
      </div>

      <main className="lg:ml-64 min-h-screen bg-[#f8f9fd]">
        <HomeNavbar />

        <div className="px-10 py-8 max-w-[1600px] mx-auto space-y-6">
          <AnalyticsHeader
            selectedDays={selectedDays}
            setSelectedDays={setSelectedDays}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            projects={reportableProjects}
            options={DATE_OPTIONS}
            shadow={shadow}
          />

          {statCards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {statCards.map((card, i) => (
                <StatCard key={i} {...card} />
              ))}
            </div>
          )}

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-9 space-y-6">
              <AnalyticsCharts
                lineData={lineData}
                pieData={pieData}
                PIE_COLORS={PIE_COLORS}
                stats={stats}
                shadow={shadow}
              />

              <TeamPerformance
                barData={barData}
                maxBar={maxBar}
                shadow={shadow}
              />

              <RiskTasksTable
                riskRows={riskRows}
                shadow={shadow}
              />
            </div>

            <aside className="col-span-12 lg:col-span-3">
              <div
                className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-20 flex flex-col"
                style={shadow}
              >
                {selectedProjectId ? (
                  <ProjectRecentActivity projectId={selectedProjectId} />
                ) : (
                  <p className="text-xs text-gray-400">Select a project to see activity.</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}