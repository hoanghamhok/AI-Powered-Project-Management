// src/home/components/DashboardSidebar.tsx
import { Link } from "react-router-dom";
import { CheckCircle2, FileText, MessageSquare } from "lucide-react";

type ActivityType = "comment" | "task_moved" | "file_upload";

type Activity = {
  id: string;
  type: ActivityType;
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  target: {
    name: string;
    link: string;
  };
  details?: {
    comment?: string;
    taskStatus?: string;
    fileCount?: number;
  };
  timestamp: string;
};

type Event = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
};

interface DashboardSidebarProps {
  activities?: Activity[];
  events?: Event[];
}

export function DashboardSidebar({ activities = [], events = [] }: DashboardSidebarProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate(),
    };
  };

  const renderActivityDetails = (activity: Activity) => {
    switch (activity.type) {
      case "comment":
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-2 border-indigo-200">
            <p className="text-sm text-gray-600 italic">
              "{activity.details?.comment}"
            </p>
          </div>
        );
      case "task_moved":
        return (
          <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-sm font-medium">
            {activity.details?.taskStatus}
          </span>
        );
      case "file_upload":
        return (
          <div className="flex gap-2 mt-2">
            {[...Array(activity.details?.fileCount || 0)].slice(0, 3).map((_, idx) => (
              <div key={idx} className="w-16 h-16 bg-gray-200 rounded-lg border border-gray-300"></div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  // Mock data nếu không có data từ props
  const mockActivities: Activity[] = activities.length > 0 ? activities : [
    {
      id: "1",
      type: "comment",
      user: { name: "John Cooper" },
      action: "commented on",
      target: { name: "Blueprint V4", link: "#" },
      details: {
        comment: "The structural column layout in Section B needs a second look regarding the HVAC integration.",
      },
      timestamp: "24 MINUTES AGO",
    },
    {
      id: "2",
      type: "task_moved",
      user: { name: "Sarah Miller" },
      action: "moved",
      target: { name: "Task #402", link: "#" },
      details: { taskStatus: "Done" },
      timestamp: "2 HOURS AGO",
    },
    {
      id: "3",
      type: "file_upload",
      user: { name: "Emma Wilson" },
      action: "uploaded 4 new files to",
      target: { name: "Design System", link: "#" },
      details: { fileCount: 4 },
      timestamp: "5 HOURS AGO",
    },
  ];

  const mockEvents: Event[] = events.length > 0 ? events : [
    {
      id: "1",
      title: "Design Sync",
      date: "2024-10-25",
      startTime: "10:00 AM",
      endTime: "11:30 AM",
    },
    {
      id: "2",
      title: "Client Presentation",
      date: "2024-10-27",
      startTime: "02:00 PM",
      endTime: "03:30 PM",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-6">
          {mockActivities.map((activity) => (
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
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {activity.user.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="font-semibold text-gray-900">{activity.user.name}</span>
                  <span className="text-gray-600">{activity.action}</span>
                  <Link
                    to={activity.target.link}
                    className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                  >
                    {activity.target.name}
                  </Link>
                  {activity.type === "task_moved" && renderActivityDetails(activity)}
                </div>

                {activity.type !== "task_moved" && renderActivityDetails(activity)}

                <p className="text-xs text-gray-500 mt-2 uppercase tracking-wide">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
        <div className="space-y-4">
          {/* Events List */}
          <div className="space-y-4 mb-6">
            {mockEvents.map((event) => {
              const { month, day } = formatDate(event.date);
              return (
                <div key={event.id} className="flex gap-4 items-start">
                  {/* Date Badge */}
                  <div className="flex-shrink-0 text-center">
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                      {month}
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{day}</div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
                    <p className="text-sm text-gray-600">
                      {event.startTime} - {event.endTime}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View Calendar Link */}
          <Link
            to="/calendar"
            className="block text-center text-indigo-600 hover:text-indigo-700 font-medium text-sm hover:underline mb-6"
          >
            View Calendar
          </Link>

          {/* Architect Pro Card */}
          <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="absolute -right-4 top-8 w-24 h-24 bg-white/10 rounded-full"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2">Architect Pro</h3>
              <p className="text-indigo-100 text-sm mb-6">
                Unlock advanced analytics and team collaboration tools.
              </p>
              <button className="bg-white text-indigo-600 font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors shadow-md">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}