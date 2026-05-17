import { Icon } from "./Icon";
import { useNavigate } from "react-router-dom";

export interface RiskRowProps {
  taskId: string;
  projectId: string;
  taskName: string;
  category: string;
  assignees: {
    img: string;
    name: string;
  }[];
  deadline: string;
  deadlineSub: string;
  deadlineColor: string;
  deadlineSubColor: string;
  statusLabel: string;
  statusBg: string;
  statusColor: string;
}

const shadow = {
  boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
} as const;

export function RiskRow({
  taskId, projectId, taskName, category, assignees,
  deadline, deadlineSub, deadlineColor, deadlineSubColor,
  statusLabel, statusBg, statusColor,
}: RiskRowProps) {
  const navigate = useNavigate();

  return (
    <tr 
      className="hover:bg-gray-50/60 transition-colors group border-t border-gray-100 cursor-pointer"
      onClick={() => navigate(`/projects/${projectId}`)}
    >
      <td className="px-6 py-5">
        <div className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{taskName}</div>
        <div className="text-xs text-gray-400 mt-0.5">{category}</div>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center">
          <div className="flex -space-x-2 overflow-hidden">
            {assignees.map((a, idx) => (
              <img
                key={idx}
                src={a.img}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                style={shadow}
                title={a.name}
                alt={a.name}
              />
            ))}
          </div>
          {assignees.length === 1 && (
             <span className="ml-3 text-sm font-semibold text-gray-700">{assignees[0].name}</span>
          )}
          {assignees.length > 1 && (
            <span className="ml-3 text-xs font-medium text-gray-500">
              {assignees.length} people
            </span>
          )}
          {assignees.length === 0 && (
            <span className="text-xs italic text-gray-400">Unassigned</span>
          )}
        </div>
      </td>
      <td className="px-6 py-5">
        <div className={`text-sm font-bold ${deadlineColor}`}>{deadline}</div>
        <div className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${deadlineSubColor}`}>
          {deadlineSub}
        </div>
      </td>
      <td className="px-6 py-5">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${statusBg} ${statusColor}`}>
          {statusLabel}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <button 
          className="px-3 py-1.5 bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-900 hover:text-white transition-all"
        >
          View
        </button>
      </td>
    </tr>
  );
}

