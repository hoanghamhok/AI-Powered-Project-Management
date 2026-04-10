import { useQuery, useQueryClient,useMutation } from '@tanstack/react-query';
import type { Column } from "../type";
import { fetchColumnsByProject,createColumn, deleteColumn,moveColumn,updateColumn,markColumnAsDone } from "../columns.api";

export function useColumn(projectId: string) {
  const queryClient = useQueryClient();
  const columnsQuery = useQuery<Column[]>({
    queryKey: ["columns", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await fetchColumnsByProject(projectId);
      return res.data;
    }
  });

  const addMutation = useMutation({
    mutationFn: createColumn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["columns", projectId] });
    },
  })

  const add = (title:string) => addMutation.mutate({ title,projectId});

  const removeMutation = useMutation({
    mutationFn:deleteColumn,
    onSuccess:() => {
      queryClient.invalidateQueries({ queryKey: ["columns", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });//xóa cột thì mất task nên cần refresh data
    }
  })

  const remove = (id:string) => removeMutation.mutate(id);

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string } }) =>
      updateColumn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["columns", projectId] });
    },
  });

  const edit = (id: string, title: string) => {
    return editMutation.mutateAsync({ id, data: { title } });
  };

  const moveMutation = useMutation({
      mutationFn: ({
        columnId,
        payload,
      }: {
        columnId: string;
        payload: {
          beforeColumnId?: string;
          afterColumnId?: string;
        };
      }) => moveColumn(columnId, payload),

      onMutate: async ({ columnId, payload }) => {
        await queryClient.cancelQueries({
          queryKey: ["columns", projectId],
        });

        const prevColumns =
          queryClient.getQueryData<Column[]>(["columns", projectId]);

        if (!prevColumns) return { prevColumns };

        const columns = [...prevColumns];
        const fromIndex = columns.findIndex(c => c.id === columnId);
        if (fromIndex === -1) return { prevColumns };

        const [moved] = columns.splice(fromIndex, 1);

        let toIndex = columns.length;

        if (payload.beforeColumnId) {
          toIndex = columns.findIndex(c => c.id === payload.beforeColumnId);
        }

        if (payload.afterColumnId) {
          const index = columns.findIndex(c => c.id === payload.afterColumnId);
          toIndex = index + 1;
        }

        columns.splice(toIndex, 0, moved);

        queryClient.setQueryData(["columns", projectId], columns);

        return { prevColumns };
      },

  
      onError: (_err, _vars, ctx) => {
        if (ctx?.prevColumns) {
          queryClient.setQueryData(
            ["columns", projectId],
            ctx.prevColumns
          );
        }
      },
  
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: ["columns", projectId],
        });
      },
  });

  const move = (
    columnId: string,
    beforeColumnId?: string,
    afterColumnId?: string
  ) => {
    return moveMutation.mutateAsync({
      columnId,
      payload: { beforeColumnId, afterColumnId },
    });
  };

  const markDoneMutation = useMutation({
    mutationFn: markColumnAsDone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["columns", projectId] });
    },
  });

  const markAsDone = (id: string) => {
    return markDoneMutation.mutateAsync(id);
  };

  return {
    columns:columnsQuery.data || [],
    loading:columnsQuery.isLoading,
    error:columnsQuery.error,
    isAddingLoading: addMutation.isPending,
    isEditingLoading: editMutation.isPending,
    add,
    remove,
    edit,
    move,
    markAsDone
  }
}
