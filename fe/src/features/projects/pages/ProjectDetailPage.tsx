  import { useParams } from "react-router-dom";
  import { useState } from "react";
  import { useProjectDetailPage } from "../hooks/useProjectDetailPage";
  import { ColumnCard } from "../../columns/components/ColumnCard";
  import { DragContextProvider } from "../components/DragContextProvider";
  import { TaskDetailModal } from "../../tasks/components/TaskDetailModal";
  import { Loader2 } from "lucide-react";
  import type { Task } from "../../tasks/types";
  import { ProjectHeader } from "../components/ProjectHeader";
  import { InviteMemberModal } from "../components/InviteMemberModal";
  import ChatBox from "../../ai/components/Chatbot";
  import { ColumnForm } from "../../columns/components/ColumnForm";

  export default function ProjectDetailPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const {project,columns,role,isLoading,isError,handleDragEnd} = useProjectDetailPage(projectId!);

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
    return (
      <DragContextProvider onDragEnd={handleDragEnd}>
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
          <div className="p-4 sm:p-6 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-4 sm:gap-6 pb-4 items-start min-h-[calc(100vh-180px)]">
              {columns.map((column) => (
                <ColumnCard
                  key={column.id}
                  columnId={column.id}
                  projectId={projectId}
                />
              ))}

              {/* Add Column */}
              <ColumnForm projectId={projectId}/>
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