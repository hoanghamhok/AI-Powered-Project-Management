import { useParams } from "react-router-dom";
import { useColumn } from "../../columns/hooks/useColumn";
import { useTask } from "../../tasks/hooks/useTasks";
import { useProjectDetails } from "../hooks/useProjectDetails";
import { useProjectMembers } from "../../members/hooks/useProjectMembers";
import { useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useProjectRole } from "../hooks/useProjectRole";
import { MembersAvatar } from "../components/MembersAvatar";
import { InviteMemberModal } from "../components/InviteMemberModal";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { DragContextProvider } from "../components/DragContextProvider";
import { ColumnCard } from "../../columns/components/ColumnCard";
import { useDnd } from "../../tasks/hooks/useDnd";
import { LeaveProject } from "../components/LeaveProject";
import type { Task } from "../../tasks/types";
import { TaskDetailModal } from "../../tasks/components/TaskDetailModal";
import { Plus, X, Columns } from "lucide-react";
import ChatBox from "../../ai/components/Chatbot";

export default function ProjectDetailPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [columnTitle, setColumnTitle] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "column" | "task";
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Invalid project
      </div>
    );
  }

  const { move } = useTask(projectId);

  const {
    data: projectRes,
    isLoading: projectLoading,
    isError: projectError,
  } = useProjectDetails(projectId);

  const { data: membersRes, refetch: refetchMembers } = useProjectMembers(projectId);

  const {
    columns,
    loading: columnLoading,
    add: addColumn,
    edit: editColumn,
    remove: deleteColumn,
    markAsDone: markColumnAsDone,
  } = useColumn(projectId);

  const {
    byColumn,
    loading: taskLoading,
    add: addTask,
    edit: editTask,
    remove: deleteTask,
  } = useTask(projectId);

  if (projectLoading || columnLoading || taskLoading) {
    return (
      <div className="flex items-center justify-center h-screen gap-3 text-gray-500">
        <svg className="w-5 h-5 animate-spin text-violet-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
        <span className="text-sm font-medium">Loading project…</span>
      </div>
    );
  }

  if (projectError || !projectRes) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500 text-sm">
        Project not found
      </div>
    );
  }

  const project = projectRes.data;
  const members = membersRes?.data ?? [];
  const { isAdmin, canSetOwner } = useProjectRole(members, user ?? undefined);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === "column") {
        await deleteColumn(deleteTarget.id);
      } else {
        await deleteTask(deleteTarget.id);
      }
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragEnd = useDnd({ columns, byColumn, move });

  const handleAddColumn = () => {
    if (!columnTitle.trim()) return;
    addColumn(columnTitle.trim());
    setColumnTitle("");
    setIsAdding(false);
  };

  return (
    <DragContextProvider onDragEnd={handleDragEnd}>
      {/* ── Modals ── */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmOpen}
        title={deleteTarget?.type === "column" ? "Delete Column" : "Delete Task"}
        message={
          deleteTarget?.type === "column"
            ? `Are you sure you want to delete "${deleteTarget?.name}" and all its tasks?`
            : `Are you sure you want to delete the task "${deleteTarget?.name}"?`
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeleteTarget(null);
        }}
      />

      <InviteMemberModal
        projectId={projectId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => refetchMembers()}
      />

      {/* ── Header ──*/}
      <header className="sticky top-0 z-10 
        mx-3 mt-3 px-6 py-4 
        bg-white border border-gray-200 
        rounded-2xl 
        flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 flex items-center justify-center 
            rounded-xl bg-violet-100 text-violet-600 font-bold text-sm shadow-sm">
            {project.name?.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {project.name}
              </h1>

              {isAdmin && (
                <span className="text-[11px] px-2 py-0.5 rounded-md 
                  bg-violet-100 text-violet-700 font-medium">
                  Admin
                </span>
              )}
            </div>

            {project.description && (
              <p className="text-gray-500 text-sm truncate mt-0.5">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 
            bg-gray-50 border border-gray-200 rounded-xl">
            <MembersAvatar
              projectId={projectId}
              isAdmin={isAdmin}
              canSetOwner={canSetOwner}
              onInviteClick={() => setIsInviteModalOpen(true)}
            />
          </div>

          <div className="px-2 py-1 rounded-lg hover:bg-red-50 transition">
            <LeaveProject projectId={projectId} />
          </div>
        </div>
      </header>

      {/* ── Error banner ── */}
      {errorMessage && (
        <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 flex justify-between items-center">
          <span className="text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span> {errorMessage}
          </span>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition"
          >
            <X className="w-4 h-4" />
          </button> 
        </div>
      )}

      {/* ── Board ── */}
      <main className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 min-h-full">
          {columns.map((column) => (
            <div key={column.id} className="w-full">  
              <ColumnCard
                column={column}
                tasks={byColumn[column.id] ?? []}
                members={members}
                isAdmin={isAdmin}
                projectId={projectId}
                markColumnAsDone={markColumnAsDone}
                editColumn={editColumn}
                onOpenTaskDetail={(task) => setSelectedTask(task)}
                deleteColumn={(id, name) => {
                  setDeleteTarget({ type: "column", id, name });
                  setDeleteConfirmOpen(true);
                }}
                addTask={async (columnId, title, projectId, description, assigneeIds, dueDate,estimateHours,difficulty) => {
                  await addTask(columnId, title, projectId, description, assigneeIds, dueDate ?? "",estimateHours,difficulty);
                }}
                editTask={editTask}
                deleteTask={(id, title) => {
                  setDeleteTarget({ type: "task", id, name: title });
                  setDeleteConfirmOpen(true);
                }}
              />
            </div>
          ))}

          {/* ── Add Column ── */}
          <div className="w-full">
            {isAdding ? (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-violet-400 to-sky-400" />
                <div className="p-4 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    New Column
                  </p>
                  <input
                    autoFocus
                    value={columnTitle}
                    onChange={(e) => setColumnTitle(e.target.value)}
                    placeholder="Column title…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddColumn();
                      if (e.key === "Escape") {
                        setIsAdding(false);
                        setColumnTitle("");
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddColumn}
                      disabled={!columnTitle.trim()}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                        columnTitle.trim()
                          ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Add Column
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setColumnTitle("");
                      }}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="group w-full h-14 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                Add column
              </button>
            )}
          </div>
        </div>
      </main>
      <ChatBox projectId={projectId}/>      
      {/* ── Task Detail Modal ─────────────────────────────────────── */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </DragContextProvider>
    
  );
}