import { useEffect, useRef } from "react";
import dayjs from "dayjs";
import type { Task } from "../types";
import { CommentSection } from "../../comment/components/CommentSection";
import { useAuth } from "../../auth/hooks/useAuth";

// Icons
import { TfiAlignLeft } from "react-icons/tfi";
import { MdOutlineDateRange } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import { Gauge, X, Lock, Unlock, History, AlertCircle, Link, Trash2, Plus, CheckCircle2, Circle } from "lucide-react";
import { useTask } from "../hooks/useTasks";
import { tasksAPI } from "../tasks.api";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRiskScore } from "../hooks/useRiskScore";

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

const StatusBadge = ({ columnId, columnTitle }: { columnId: string; columnTitle?: string }) => {
  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
    'todo': { bg: 'bg-slate-500/10', text: 'text-slate-600', label: 'To Do' },
    'in-progress': { bg: 'bg-indigo-500/10', text: 'text-indigo-600', label: 'In Progress' },
    'done': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'Done' },
  };
  
  // Use columnTitle if available, otherwise fall back to statusMap
  const displayLabel = columnTitle || statusMap[columnId]?.label || columnId;
  
  // Determine style based on columnId or columnTitle
  let style = statusMap[columnId];
  if (!style && columnTitle) {
    // If we have a custom column title, use a neutral style
    const titleLower = columnTitle.toLowerCase();
    if (titleLower.includes('done')) {
      style = statusMap['done'];
    } else if (titleLower.includes('progress')) {
      style = statusMap['in-progress'];
    } else {
      style = statusMap['todo'];
    }
  }
  style = style || { bg: 'bg-gray-500/10', text: 'text-gray-600', label: columnId };
  
  return (
    <div
      className={`inline-flex items-center px-4 py-2 ${style.bg} ${style.text} rounded-full border border-current/10`}
    >
      <div className="flex items-center justify-center w-full relative">
        
        {/* Dot */}
        <div className={`absolute left-0 w-2 h-2 rounded-full ${style.text.replace('text-', 'bg-')} animate-pulse`} />
        
        {/* Text */}
        <span className="text-sm font-bold tracking-tight mx-auto">
          {displayLabel}
        </span>
      </div>
    </div>
  );
};

const InfoItem = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  subValueClassName,
}: { 
  icon: any; 
  label: string; 
  value: string; 
  subValue?: string;
  subValueClassName?: string;
}) => (
  <div className="group flex items-start gap-4 transition-all duration-200 hover:translate-x-1">
    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-white to-slate-50 flex items-center justify-center text-indigo-600 shadow-sm border border-slate-200/70 group-hover:shadow-md group-hover:border-indigo-200 transition-all duration-200">
      <Icon size={20} />
    </div>
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>
      <p className="text-[15px] font-bold text-slate-900 leading-tight">
        {value}
      </p>
      {subValue && (
        <p className={`text-xs font-semibold px-2.5 py-1 rounded-lg w-fit ${subValueClassName || 'text-indigo-600 bg-indigo-50'}`}>
          {subValue}
        </p>
      )}
    </div>
  </div>
);

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { block, unblock } = useTask(task.projectId);
  const [blockReason, setBlockReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [selectedTaskToDepend, setSelectedTaskToDepend] = useState("");
  const [isLoadingDeps, setIsLoadingDeps] = useState(false);
  const queryClient = useQueryClient();
  const { data: riskScore = 0 } = useRiskScore(task.id);
  const isOverdue = Boolean(task.dueDate && !task.completedAt && dayjs(task.dueDate).isBefore(dayjs()));

  const fetchHistory = async () => {
    try {
      const res = await tasksAPI.getBlockHistory(task.id);
      setHistory(res.data);

    } catch (error) {
      console.error("Failed to fetch block history", error);
    }
  };

  const fetchDependencies = async () => {
    setIsLoadingDeps(true);
    try {
      const res = await tasksAPI.getDependencies(task.id);
      setDependencies(res.data);
    } catch (error) {
      console.error("Failed to fetch dependencies", error);
    } finally {
      setIsLoadingDeps(false);
    }
  };

  const fetchProjectTasks = async () => {
    try {
      const res = await tasksAPI.getByProjectId(task.projectId);
      // Filter out current task and already dependent tasks
      const filtered = res.data.filter((t: Task) => 
        t.id !== task.id && !dependencies.some(d => d.dependsOnTaskId === t.id)
      );
      setProjectTasks(filtered);
    } catch (error) {
      console.error("Failed to fetch project tasks", error);
    }
  };

  // const fetchRiskScore = async () => {
  //   try {
  //     const res = await tasksAPI.getRiskScore(task.id);
  //     setRiskScore(res.data.riskScore);
  //   } catch (error) {
  //     console.error("Failed to fetch risk score", error);
  //   }
  // };

  const user = useAuth((s) => s.user);

  useEffect(() => {
    fetchHistory();
    fetchDependencies();
    // fetchRiskScore();
  }, [task.id]);

  useEffect(() => {
    if (task.projectId) {
      fetchProjectTasks();
    }
  }, [task.projectId, dependencies]);
  const handleBlock = async () => {
    if (!blockReason.trim()) return;
    try {
      await block(task.id, blockReason);
      setBlockReason("");
      setIsBlocking(false);
      fetchHistory();
      queryClient.invalidateQueries({ queryKey: ['riskScore', task.id] });
    } catch (error) {
      console.error("Failed to block task", error);
    }
  };

  const handleUnblock = async () => {
    try {
      await unblock(task.id);
      fetchHistory();
      queryClient.invalidateQueries({ queryKey: ['riskScore', task.id] });
    } catch (error) {
      console.error("Failed to unblock task", error);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedTaskToDepend) return;
    try {
      await tasksAPI.addDependency(task.id, selectedTaskToDepend);
      setSelectedTaskToDepend("");
      fetchDependencies();
      queryClient.invalidateQueries({ queryKey: ['riskScore', task.id] });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add dependency");
    }
  };

  const handleRemoveDependency = async (dependsOnId: string) => {
    try {
      await tasksAPI.removeDependency(task.id, dependsOnId);
      fetchDependencies();
      queryClient.invalidateQueries({ queryKey: ['riskScore', task.id] });
    } catch (error) {
      console.error("Failed to remove dependency", error);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    modalRef.current?.focus();
    
    document.body.style.overflow = 'hidden';
    
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        className="bg-white w-full max-w-6xl h-full max-h-[92vh] rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200/60 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="md:hidden absolute top-4 right-4 z-50 w-11 h-11 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 active:scale-95"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="flex-1 p-6 md:pt-8 lg:pt-10 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          
          <div className="space-y-6">
            <nav 
              className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase"
              aria-label="Breadcrumb"
            >
              <span>Projects</span>
              <span className="text-slate-300">/</span>
              <span className="text-indigo-600">Task-{task.id}</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <h1 
                id="task-title"
                className="text-3xl md:text-4xl lg:text-4xl font-black tracking-tight text-slate-900 leading-[1.1] pr-12 md:pr-0"
              >
                {task.title}
              </h1>

              <div className="flex items-center gap-3 shrink-0">              
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="hidden md:flex w-12 h-12 items-center justify-center rounded-xl bg-gradient-to-b from-white to-slate-50 text-slate-400 shadow-sm hover:shadow-md hover:text-red-500 hover:bg-red-50 transition-all duration-200 border border-slate-200 active:scale-95"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <section className="space-y-5" aria-labelledby="description-heading">
            <div className="flex items-center gap-3 text-indigo-600">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <TfiAlignLeft size={18} strokeWidth={1.5} />
              </div>
              <h2 id="description-heading" className="text-xl font-bold tracking-tight">
                Description
              </h2>
            </div>

            <div className="text-slate-600 leading-relaxed text-[15.5px] max-w-3xl">
              {task.description ? (
                <p className="whitespace-pre-line font-medium">
                  {task.description}
                </p>
              ) : (
                <p className="text-slate-400 italic font-normal bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  No description provided for this task.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-6 pt-8 border-t border-slate-200/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-indigo-600">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Link size={18} strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Dependencies</h2>
              </div>
            </div>

            <div className="space-y-4">
              {/* Add Dependency UI */}
              <div className="flex gap-2">
                <select
                  value={selectedTaskToDepend}
                  onChange={(e) => setSelectedTaskToDepend(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select a task to depend on...</option>
                  {projectTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddDependency}
                  disabled={!selectedTaskToDepend}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>

              {/* Dependency List */}
              <div className="space-y-2">
                {dependencies.length > 0 ? (
                  dependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {dep.dependsOn.completedAt ? (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        ) : (
                          <Circle size={18} className="text-slate-300" />
                        )}
                        <div>
                          <p className={`text-sm font-bold ${dep.dependsOn.completedAt ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {dep.dependsOn.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {dep.dependsOn.column?.title || 'Unknown Status'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDependency(dep.dependsOnTaskId)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic py-2">No dependencies set for this task.</p>
                )}
              </div>
            </div>
          </section>

          <section 
            className=" border-t flex flex-col"
            aria-label="Comments"
          >
            <div className="max-h-[470px] overflow-y-auto pr-2">
              <CommentSection taskId={task.id} projectId={task.projectId} />
            </div>
          </section>
        </div>

        <aside className="w-full md:w-80 lg:w-96 bg-gradient-to-b from-slate-50/80 to-slate-100/40 p-6 md:p-10 lg:p-12 space-y-10 border-l border-slate-200/80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          
          <div className="space-y-8">
            <div className="space-y-3.5">
              <p className=" text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Current Status
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge columnId={task.columnId} columnTitle={task.column?.title} />
                {task.blocked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-[0.18em] px-3 py-2 border border-amber-200">
                    <AlertCircle size={12} />
                    Blocked
                  </span>
                )}
                {task.isBlockedByDependency && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold uppercase tracking-[0.18em] px-3 py-2 border border-rose-200">
                    <AlertCircle size={12} />
                    Blocked by Dependency
                  </span>
                )}
              </div>
            </div>

            {/* Blocking UI */}
            <div className="space-y-4 pt-4 border-t border-slate-200/70">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Blocking Control
              </p>
              
              {!task.blocked ? (
                isBlocking ? (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <textarea
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Reason for blocking..."
                      className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none h-24"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleBlock}
                        disabled={!blockReason.trim()}
                        className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        Confirm Block
                      </button>
                      <button
                        onClick={() => setIsBlocking(false)}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsBlocking(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-dashed border-amber-200 text-amber-600 rounded-2xl text-sm font-bold hover:bg-amber-50 hover:border-amber-300 transition-all active:scale-[0.98]"
                  >
                    <Lock size={16} />
                    Block Task
                  </button>
                )
              ) : (
                <button
                  onClick={handleUnblock}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-md active:scale-[0.98]"
                >
                  <Unlock size={16} />
                  Unblock Task
                </button>
              )}
            </div>
            
            {/* Risk Prediction UI */}
            <div className="space-y-4 pt-4 border-t border-slate-200/70">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Risk Prediction
              </p>
              {!user?.isPremium ? (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <AlertCircle size={20} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">Premium Required</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 px-2">
                    Nâng cấp Premium để sử dụng AI dự đoán rủi ro cho công việc này.
                  </p>
                  <button
                    onClick={() => window.location.href = '/premium'}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-sm"
                  >
                    Nâng cấp ngay
                  </button>
                </div>
              ) : (
                <div className={`p-5 rounded-3xl border flex items-center justify-between transition-all duration-300 ${
                  riskScore >= 0.7 ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' :
                  riskScore >= 0.4 ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' :
                  'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                      riskScore >= 0.7 ? 'bg-rose-100/80' :
                      riskScore >= 0.4 ? 'bg-amber-100/80' :
                      'bg-emerald-100/80'
                    }`}>
                      <AlertCircle size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight">
                        {riskScore >= 0.7 ? 'High Risk' :
                         riskScore >= 0.4 ? 'Medium Risk' :
                         'Low Risk'}
                      </p>
                      <p className="text-[11px] opacity-80 font-bold uppercase tracking-wider mt-0.5">
                        AI Predicts: {(riskScore * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Difficulty */}
            {task.difficulty && (
              <div className="space-y-3.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Difficulty Level
                </p>
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 hover:scale-[1.02]">
                  <Gauge size={16} className="text-indigo-600" strokeWidth={2.5} />
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    {task.difficulty}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Group */}
          <div className="space-y-7 pt-10 border-t border-slate-200/70">
            {task.dueDate && (
              <InfoItem
                icon={MdOutlineDateRange}
                label="Due Date"
                value={dayjs(task.dueDate).format("MMM DD, YYYY • HH:mm")}
                subValue={isOverdue ? "Overdue" : undefined}
                subValueClassName={isOverdue ? "text-rose-700 bg-rose-100" : undefined}
              />
            )}

            {task.estimateHours && (
              <InfoItem
                icon={IoMdTime}
                label="Time Estimate"
                value={`${task.estimateHours} hours`}
              />
            )}
          </div>

          {/* Block History */}
          <div className="space-y-6 pt-10 border-t border-slate-200/70">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <History size={16} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-indigo-600 transition-colors">
                  Block History
                </p>
              </div>
              <div className={`transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {showHistory && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {history.length > 0 ? (
                  <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {history.map((item) => (
                      <div key={item.id} className="relative space-y-1.5">
                        <div className={`absolute -left-[1.35rem] top-1.5 w-3 h-3 rounded-full border-2 border-white ${item.unblockedAt ? 'bg-emerald-500' : 'bg-amber-500 ring-4 ring-amber-50'}`} />
                        <p className="text-xs font-bold text-slate-800">
                          {item.unblockedAt ? 'Task Unblocked' : 'Task Blocked'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {dayjs(item.blockedAt).format("MMM DD, YYYY")} 
                          {item.unblockedAt && ` → ${dayjs(item.unblockedAt).format("MMM DD, YYYY")}`}
                        </p>
                        {!item.unblockedAt && (
                          <div className="mt-2 p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg">
                            <p className="text-[11px] text-amber-800 font-semibold italic">
                              "{item.reason}"
                            </p>
                          </div>
                        )}
                        {item.unblockedAt && (
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Duration: {dayjs(item.unblockedAt).diff(dayjs(item.blockedAt), 'hour')}h
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">No block history available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}