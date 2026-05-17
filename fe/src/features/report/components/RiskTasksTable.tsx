import { useState } from "react";
import { RiskRow } from "./RiskRow";
import type { RiskRowProps } from "./RiskRow";
import { Icon } from "./Icon";

interface RiskTasksTableProps {
  riskRows: RiskRowProps[];
  shadow: any;
  isPremium: boolean;
}

export function RiskTasksTable({ riskRows, shadow, isPremium }: RiskTasksTableProps) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string | null>(null);

  const filteredRows = riskRows.filter(
    (row) => {
      const matchesSearch = row.taskName.toLowerCase().includes(search.toLowerCase()) ||
                           row.category.toLowerCase().includes(search.toLowerCase());
      const matchesRisk = riskFilter ? row.statusLabel === riskFilter : true;
      return matchesSearch && matchesRisk;
    }
  );

  const riskLevels = [
    { label: "CRITICAL", color: "bg-red-500" },
    { label: "AT RISK", color: "bg-amber-500" },
  ];

  if (!isPremium) {
    return (
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col"
        style={shadow}
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h4 className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
              At-Risk Tasks
            </h4>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg uppercase tracking-wide">
              Premium
            </span>
          </div>
        </div>

        <div className="px-6 py-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
            <Icon name="lock" className="text-amber-500" size={24} />
          </div>
          <p className="mt-4 text-sm font-bold text-gray-900">Premium feature</p>
          <p className="mt-2 text-xs text-gray-400 max-w-sm mx-auto">
            Upgrade to Premium to view medium and high risk tasks in this project.
          </p>
          <button
            onClick={() => (window.location.href = "/premium")}
            className="mt-5 px-4 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col"
      style={shadow}
    >
      <div className="px-6 py-5 border-b border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h4 className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
              At-Risk Tasks
            </h4>
            <span className="px-2.5 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-lg uppercase tracking-wide">
              {filteredRows.length} {filteredRows.length === 1 ? "Task" : "Tasks"}
            </span>
          </div>
          
          <div className="relative group max-w-xs w-full">
            <Icon 
              name="search" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" 
              size={18} 
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setRiskFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              riskFilter === null 
                ? "bg-gray-900 text-white shadow-sm" 
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Medium & High
          </button>
          {riskLevels.map((level) => (
            <button
              key={level.label}
              onClick={() => setRiskFilter(level.label)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                riskFilter === level.label 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${level.color}`} />
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50/90 backdrop-blur-sm shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              {["Task Name", "Assignee", "Deadline", "Status", ""].map(
                (h, i) => (
                  <th
                    key={i}
                    className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-400"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row, i) => (
                <RiskRow key={i} {...row} />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Icon name="check_circle" className="text-emerald-500" size={24} />
                    </div>
                    <p className="text-sm font-bold text-gray-900">No high-risk tasks found</p>
                    <p className="text-xs text-gray-400 max-w-[200px] mx-auto">
                      {search ? `No tasks match "${search}"` : "Great job! All your tasks are currently on track."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {filteredRows.length > 0 && (
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Showing {filteredRows.length} of {riskRows.length} tasks
          </p>
        </div>
      )}
    </div>
  );
}
