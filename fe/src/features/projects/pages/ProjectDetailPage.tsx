import { useParams } from "react-router-dom";
import { useState } from "react";
import { useProjectDetailPage } from "../hooks/useProjectDetailPage";
import { ColumnCard } from "../../columns/components/ColumnCard";
import { DragContextProvider } from "../components/DragContextProvider";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { TaskDetailModal } from "../../tasks/components/TaskDetailModal";
import { Plus, X, Check, Loader2 } from "lucide-react";
import type { Task } from "../../tasks/types";
import { ProjectHeader } from "../components/ProjectHeader";
import { InviteMemberModal } from "../components/InviteMemberModal";
import ChatBox from "../../ai/components/Chatbot";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const {
    project,
    members,
    columns,role,
    byColumn,
    isLoading,
    isError,
    actions,
    deleteTarget,
    isDeleting,
    setDeleteTarget,
    columnTitle,
    setColumnTitle,
  } = useProjectDetailPage(projectId!);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Project</h2>
          <p className="text-gray-500">The project ID is missing or invalid.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading project...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Project Not Found</h2>
          <p className="text-gray-500">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }
  console.log(role)
  return (
    <DragContextProvider onDragEnd={actions.handleDragEnd}>
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={actions.handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/30">
       
        {/* Header */}
        <ProjectHeader
          project={project}
          isAdmin={role.isAdmin}
          isOwner={role.isOwner}
          canSetOwner={role.canSetOwner}
          projectId={projectId}
          errorMessage={errorMessage}
          onClearError={() => setErrorMessage(null)}
          onInvite={() => setIsInviteModalOpen(true)}
        />

        {/* Board */}
        <div className="p-6 overflow-x-auto">
          <div className="flex gap-4 pb-4 min-h-[calc(100vh-180px)]">
            {columns.map((column) => (
              <ColumnCard
                key={column.id}
                column={column}
                tasks={byColumn[column.id] ?? []}
                members={members}
                isAdmin={true}
                projectId={projectId}
                markColumnAsDone={actions.markColumnAsDone}
                editColumn={actions.editColumn}
                deleteColumn={(id, name) =>
                  setDeleteTarget({ type: "column", id, name })
                }
                addTask={actions.addTask}
                editTask={actions.editTask}
                deleteTask={(id, title) =>
                  setDeleteTarget({ type: "task", id, name: title })
                }
                onOpenTaskDetail={(task) => setSelectedTask(task)}
              />
            ))}

            {/* Add Column */}
            <div className="flex-shrink-0">
              {isAdding ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 min-w-[280px] shadow-sm">
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      ➕ New Column
                    </p>
                    <input
                      autoFocus
                      value={columnTitle}
                      onChange={(e) => setColumnTitle(e.target.value)}
                      placeholder="Column title…"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && columnTitle.trim()) {
                          actions.handleAddColumn();
                          setIsAdding(false);
                        }
                        if (e.key === "Escape") {
                          setIsAdding(false);
                          setColumnTitle("");
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          actions.handleAddColumn();
                          setIsAdding(false);
                        }}
                        disabled={!columnTitle.trim()}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition ${
                          columnTitle.trim()
                            ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setIsAdding(false);
                          setColumnTitle("");
                        }}
                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2 px-4 py-3 min-w-[280px] text-left text-sm font-medium text-gray-600 hover:text-gray-900 bg-white/60 hover:bg-white border-2 border-dashed border-gray-300 hover:border-violet-400 rounded-2xl transition-all group"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span>Add Column</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
       <InviteMemberModal
        projectId={projectId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
       />
       <ChatBox projectId={projectId}/>       
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </DragContextProvider>
  );
}