import { useNavigate, useParams } from "react-router-dom";
import { 
  FaClipboardList, 
  FaTh, 
  FaListAlt, 
  FaUsers, 
  FaChartBar,
  FaCog,
  FaQuestionCircle,
  FaPlus
} from "react-icons/fa";

type SidebarProps = {
  activeMenu: string;
  isOpen?: boolean;
  onClose?: () => void;
};

const Sidebar = ({ activeMenu, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const menu = [
    { id: "board", label: "Board", icon: FaTh },
    { id: "backlog", label: "Backlog", icon: FaListAlt },
    { id: "team", label: "Team", icon: FaUsers },
    { id: "reports", label: "Reports", icon: FaChartBar },
  ];

  return (
    <aside className="h-full flex flex-col p-6 space-y-8 text-sm">

      {/* HEADER */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-700 flex items-center justify-center text-white">
          <FaClipboardList className="text-lg" />
        </div>
        <div>
          <h2 className="font-bold text-indigo-700 text-base">
            Project
          </h2>
          <p className="text-xs text-slate-500">Workspace</p>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-grow space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(`/projects/${projectId}/${item.id}`);
                onClose?.();
              }}
              className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition
                ${
                  activeMenu === item.id
                    ? "text-indigo-700 bg-white dark:bg-slate-700/50 font-semibold"
                    : "text-slate-500 hover:bg-white/30 dark:hover:bg-slate-700/30"
                }`}
            >
              <Icon className="text-base" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="mt-auto space-y-2">

        {/* <button className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold shadow active:scale-95 transition flex items-center justify-center space-x-2">
          <FaPlus />
          <span>Create Task</span>
        </button> */}

        <button className="flex items-center space-x-3 p-3 text-slate-500 hover:bg-white/30 rounded-lg w-full">
          <FaCog className="text-base" />
          <span>Settings</span>
        </button>

        <button className="flex items-center space-x-3 p-3 text-slate-500 hover:bg-white/30 rounded-lg w-full">
          <FaQuestionCircle className="text-base" />
          <span>Help</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;