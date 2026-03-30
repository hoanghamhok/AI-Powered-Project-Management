import { useState, useCallback } from "react";
import { useTask } from "../../tasks/hooks/useTasks";
import { useColumn } from "../../columns/hooks/useColumn";
import { useProjectDetails } from "./useProjectDetails";
import { useProjectMembers } from "../../members/hooks/useProjectMembers";
import { useAuth } from "../../auth/hooks/useAuth";
import { useDnd } from "../../tasks/hooks/useDnd";
import { useProjectRole } from "./useProjectRole";

export const useProjectDetailPage = (projectId: string) => {
  const { user } = useAuth();
  const {
    move,
    byColumn,
    add: addTask,
    edit: editTask,
    remove: deleteTask,
  } = useTask(projectId);

  const {data: projectRes,isLoading: projectLoading,isError: projectError,} = useProjectDetails(projectId); 
  const project = projectRes?.data;
  const { data: membersRes, refetch: refetchMembers } =useProjectMembers(projectId);
  const members=membersRes;
  const role = useProjectRole(members, user ?? undefined)
  const {
    columns,
    loading: columnLoading,
    add: addColumn,
    edit: editColumn,
    remove: deleteColumn,
    markAsDone: markColumnAsDone,
  } = useColumn(projectId);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "column" | "task";
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [columnTitle, setColumnTitle] = useState("");

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      if (deleteTarget.type === "column") {
        await deleteColumn(deleteTarget.id);
      } else {
        await deleteTask(deleteTarget.id);
      }

      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, deleteColumn, deleteTask]);

  const handleAddColumn = useCallback(() => {
    if (!columnTitle.trim()) return;

    addColumn(columnTitle.trim());
    setColumnTitle("");
  }, [columnTitle, addColumn]);

  const handleDragEnd = useDnd({
    columns,
    byColumn,
    move,
  });

  const isLoading = projectLoading || columnLoading;
  const isError = projectError || !project;
  return {
    project,
    members,
    columns,
    byColumn,

    deleteTarget,
    isDeleting,
    columnTitle,

    setDeleteTarget,
    setColumnTitle,

    isLoading,
    isError,
    refetchMembers,

    actions: {
      addTask,
      editTask,
      deleteTask,
      addColumn,
      editColumn,
      deleteColumn,
      markColumnAsDone,
      handleDeleteConfirm,
      handleAddColumn,
      handleDragEnd,
    },

    user,
    role
  };
};