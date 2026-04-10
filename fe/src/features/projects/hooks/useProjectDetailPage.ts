import { useTask } from "../../tasks/hooks/useTasks";
import { useColumn } from "../../columns/hooks/useColumn";
import { useProjectDetails } from "./useProjectDetails";
import { useProjectMembers } from "../../members/hooks/useProjectMembers";
import { useAuth } from "../../auth/hooks/useAuth";
import { useDnd } from "../../tasks/hooks/useDnd";
import { useProjectRole } from "./useProjectRole";

export const useProjectDetailPage = (projectId: string) => {
  const { user } = useAuth();
  const {move,byColumn,} = useTask(projectId);
  const {data: projectRes,isLoading: projectLoading,isError: projectError,} = useProjectDetails(projectId); 
  const project = projectRes?.data;
  const { data: members, refetch: refetchMembers } = useProjectMembers(projectId);
  const role = useProjectRole(members, user ?? undefined)
  const {columns} = useColumn(projectId);
  const handleDragEnd = useDnd({columns,byColumn,move,});
  const isError = projectError || !project;

  return {
    project,
    members,
    columns,
    byColumn,
    isLoading: projectLoading,
    isError,
    refetchMembers,
    handleDragEnd,
    user,
    role
  };
};