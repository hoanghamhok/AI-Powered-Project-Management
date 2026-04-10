import { useMemo } from "react";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import type { Task } from "../types";
import {fetchTasksByProjectID,createTask,updateTask,deleteTask,moveTask} from "../tasks.api";
export function useTask(projectId: string) {
  const queryClient = useQueryClient();
  
  const tasksQuery = useQuery<Task[]>({
    queryKey: ["tasks", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await fetchTasksByProjectID(projectId);
      return res.data;

    },
  });

  const addMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      // queryClient.invalidateQueries({ queryKey: ["tasks"] });//hiện 1 prj 1 lúc thì ko cần cái này 
    },
  });

  const add = async (
    columnId: string,
    title: string,
    projectId: string,
    description: string,
    assigneeIds: string[],
    dueDate: string,
    estimateHours?: number,
    difficulty?: number
  ): Promise<void> => {
    await addMutation.mutateAsync({
      title,
      description,
      columnId,
      projectId,
      assigneeIds,
      dueDate,
      estimateHours: estimateHours ?? 0,
      difficulty: difficulty ?? 0,
    });
  };

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const edit = (id: string, data: Partial<Task>) => {
    return editMutation.mutateAsync({ id, data });
  };

  const removeMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const remove = (id: string) => {
    return removeMutation.mutateAsync(id);
  };

  const moveMutation = useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: {
        columnId: string;
        beforeTaskId?: string;
        afterTaskId?: string;
      };
    }) => moveTask(taskId, payload),

    onMutate: async ({ taskId, payload }) => {
      await queryClient.cancelQueries({
        queryKey: ["tasks", projectId],
      });

      const prevTasks =
        queryClient.getQueryData<Task[]>(["tasks", projectId]);

      queryClient.setQueryData<Task[]>(
        ["tasks", projectId],
        old =>
          old?.map(t =>
            t.id === taskId
              ? { ...t, columnId: payload.columnId }
              : t
          )
      );

      return { prevTasks };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prevTasks) {
        queryClient.setQueryData(
          ["tasks", projectId],
          ctx.prevTasks
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", projectId],
      });
      // Also invalidate all upcoming tasks queries
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const move = (
    taskId: string,
    columnId: string,
    beforeTaskId?: string,
    afterTaskId?: string
  ) => {
    return moveMutation.mutateAsync({
      taskId,
      payload: { columnId, beforeTaskId, afterTaskId },
    });
  };

  const byColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    const tasks = tasksQuery.data ?? [];

    for (const t of tasks) {
      if (!map[t.columnId]) map[t.columnId] = [];
      map[t.columnId].push(t);
    }

    Object.values(map).forEach(col =>
      col.sort((a, b) => a.position - b.position)
    );

    return map;
  }, [tasksQuery.data]);

  return {
    tasks: tasksQuery.data ?? [],
    byColumn,
    loading: tasksQuery.isLoading,
    error: tasksQuery.error,
    reload: tasksQuery.refetch,
    add,
    edit,
    remove,
    move,
  };
}
