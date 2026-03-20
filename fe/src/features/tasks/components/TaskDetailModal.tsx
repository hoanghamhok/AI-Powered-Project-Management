import { useEffect } from "react";
import dayjs from "dayjs";
import type { Task } from "../types";
import { CommentSection } from "../../comment/components/CommentSection";


interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  // ESC close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);
  console.log("Difficult:",task.difficulty)
  console.log("Es:",task.estimateHours)

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-[1100px] h-[85vh] rounded-2xl shadow-xl flex overflow-hidden"
      >
        {/* LEFT CONTENT */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-2xl font-semibold mb-4">{task.title}</h1>

          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 mb-2">
              Description
            </h2>

            {task.description ? (
              <p className="text-gray-700 whitespace-pre-line">
                {task.description}
              </p>
            ) : (
              <p className="text-gray-400 italic">No description</p>
            )}
          </section>

          {task.dueDate && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 mb-2">
                Due Date
              </h2>

              <p className="text-gray-700">
                {dayjs(task.dueDate).format("DD/MM/YYYY HH:mm")}
              </p>
            </section>
          )}
          <CommentSection taskId={task.id} />        
        </div>

        

        {/* RIGHT SIDEBAR */}
        <div className="w-[300px] border-l bg-gray-50 p-6">
          <h3 className="font-semibold mb-4">Details</h3>

          <Detail label="Task ID" value={task.id} />
          <Detail label="Column" value={task.columnId} />

          {task.dueDate && (
            <Detail
              label="Due"
              value={dayjs(task.dueDate).format("DD/MM/YYYY")}
            />
          )}
        </div>

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-5 right-8 text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between text-sm mb-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value || "-"}</span>
    </div>
  );
}