// src/home/components/DashboardSidebar.tsx
import { Link } from "react-router-dom";
import { useMyTasks } from "../../tasks/hooks/useMyTask";
import { useActivities } from "../../activities/hooks/useActivities";
import type { Task } from "../../tasks/types";
import type { Activity } from "../../activities/type";
import { mapActivity, highlightMentions } from "../../activities/ulti"

interface DashboardSidebarProps {
  tasks?: Task[];
}

export function DashboardSidebar({ tasks: fallbackTasks = [] }: DashboardSidebarProps) {

  const { data: myTasks = [], isLoading, error } = useMyTasks();

  const { data: rawActivities = [], isLoading: loadingActivities } = useActivities();

  const activities: Activity[] = rawActivities
    .map(mapActivity)
    .filter(Boolean) as Activity[];

  const allTasks = myTasks.length > 0 ? myTasks : fallbackTasks;

  const upcomingTasks = allTasks
    .filter(task => {
      if (!task.dueDate || task.completedAt) return false;

      const dueDate = new Date(task.dueDate);
      const now = new Date();
      const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

      return dueDate > now && dueDate <= twoDaysLater;
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return {
        month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
        day: date.getDate(),
      };
    };
    console.log(upcomingTasks)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-8 mt-12">

      {/* ================= recent act ================= */}
      <div className="bg-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Recent Activity
        </h2>

        {loadingActivities && <p>Loading activities...</p>}

        <div className="space-y-6">
          {activities.slice(0,5).map((activity) => (
            <div key={activity.id} className="flex gap-4">

              {/* Avatar */}
              <div className="flex-shrink-0">
                {activity.user.avatar ? (
                  <img
                    src={activity.user.avatar}
                    alt={activity.user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                    {activity.user.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">

                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="font-semibold text-gray-900">
                    {activity.user.name}
                  </span>

                  <span className="text-gray-600">
                    {activity.action}
                  </span>

                  <Link
                    to={activity.target.link}
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    {activity.target.name}
                  </Link>

                  {activity.project?.name && (
                    <span className="text-gray-400 text-sm">
                      in {activity.project.name}
                    </span>
                  )}
                </div>

                {activity.type === "comment" && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-2 border-indigo-200">
                    <p className="text-sm text-gray-600 italic">
                      "{highlightMentions(activity.details?.comment || "")}"
                    </p>
                  </div>
                )}

                {activity.type === "task_moved" && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-sm font-medium">
                    {activity.details?.taskStatus}
                  </span>
                )}

                {activity.type === "task_completed" && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                    Completed
                  </span>
                )}

                <p className="text-xs text-gray-500 mt-2 uppercase">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= upcoming ts ================= */}
      <div className="bg-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Upcoming Tasks
        </h2>

        {isLoading && <p>Loading tasks...</p>}
        {error && <p className="text-red-500">Failed to load tasks</p>}

        <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-xl">
          {upcomingTasks.map((task) => {
            if (!task.dueDate) return null;

            const { month, day } = formatDate(task.dueDate);

            return (
              <div key={task.id} className="flex gap-4 items-start">

                <div className="text-center">
                  <div className="text-xs text-indigo-600">{month}</div>
                  <div className="text-2xl font-bold text-gray-900">{day}</div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {task.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}