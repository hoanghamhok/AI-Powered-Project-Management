import { useEffect, useRef } from "react";
import dayjs from "dayjs";
import type { Task } from "../types";
import { CommentSection } from "../../comment/components/CommentSection";

// Icons
import { TfiAlignLeft } from "react-icons/tfi";
import { MdOutlineDateRange } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import { Gauge, X } from "lucide-react";

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

// Sub-component: Status Badge
const StatusBadge = ({ columnId }: { columnId: string }) => {
  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
    'todo': { bg: 'bg-slate-500/10', text: 'text-slate-600', label: 'To Do' },
    'in-progress': { bg: 'bg-indigo-500/10', text: 'text-indigo-600', label: 'In Progress' },
    'done': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'Done' },
  };
  
  const style = statusMap[columnId] || { bg: 'bg-gray-500/10', text: 'text-gray-600', label: columnId };
  
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 ${style.bg} ${style.text} rounded-full border border-current/10 transition-all duration-200 hover:scale-[1.02]`}>
      <div className={`w-2 h-2 rounded-full ${style.text.replace('text-', 'bg-')} animate-pulse`} />
      <span className="text-sm font-bold tracking-tight">{style.label}</span>
    </div>
  );
};

// Sub-component: Info Item
const InfoItem = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  subValue?: string;
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
        <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg w-fit">
          {subValue}
        </p>
      )}
    </div>
  </div>
);

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap và ESC handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    // Focus vào modal khi mở
    modalRef.current?.focus();
    
    // Prevent scroll
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
        {/* Close Button - Mobile */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="md:hidden absolute top-4 right-4 z-50 w-11 h-11 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 active:scale-95"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Main Content - Left */}
        <div className="flex-1 p-6 md:p-12 lg:p-16 space-y-12 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          
          {/* Header Section */}
          <div className="space-y-6">
            {/* Breadcrumb */}
            <nav 
              className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase"
              aria-label="Breadcrumb"
            >
              <span>Projects</span>
              <span className="text-slate-300">/</span>
              <span className="text-indigo-600">Task-{task.id}</span>
            </nav>

            {/* Title & Actions */}
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

          {/* Description Section */}
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

          {/* Comments Section */}
          <section 
            className=" border-t flex flex-col"
            aria-label="Comments"
          >
            <div className="max-h-[470px] overflow-y-auto pr-2">
              <CommentSection taskId={task.id} />
            </div>
          </section>
        </div>

        {/* Sidebar - Right */}
        <aside className="w-full md:w-80 lg:w-96 bg-gradient-to-b from-slate-50/80 to-slate-100/40 p-6 md:p-10 lg:p-12 space-y-10 border-l border-slate-200/80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          
          {/* Status & Difficulty Group */}
          <div className="space-y-8">
            {/* Status */}
            <div className="space-y-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Current Status
              </p>
              <StatusBadge columnId={task.columnId} />
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
        </aside>
      </div>
    </div>
  );
}