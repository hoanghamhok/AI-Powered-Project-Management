import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Comment } from "../../comment/type"
import {
  getTaskComments,
  createComment,
  deleteComment,
} from "../../comment/api/comment.api";

export function useComments(taskId: string) {
  const queryClient = useQueryClient();

    const commentsQuery = useQuery<Comment[]>({
            queryKey: ["comments", taskId],
            enabled: !!taskId,
            queryFn: async () => {
            const res = await getTaskComments(taskId);
            return res.data;
            },
    });

    const addMutation = useMutation({
        mutationFn: ({
        taskId,
        data,
        }: {
        taskId: string;
        data: any;
        }) => createComment(taskId, data),

        onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: ["comments", taskId],
        });
        },
    });

    const add = (data: {
        content: string;
        parentId?: string;
        mentions?: string[];
    }) => {
        return addMutation.mutateAsync({
        taskId,
        data,
        });
    };

    const removeMutation = useMutation({
        mutationFn: deleteComment,

        onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: ["comments", taskId],
        });
        },
    });

    const remove = (id: string) => {
        return removeMutation.mutateAsync(id);
    };

    const tree = useMemo(() => {
        const comments = commentsQuery.data ?? [];
        const map: Record<string, Comment[]> = {};

        for (const c of comments) {
        const parent = c.parentId ?? "root";

        if (!map[parent]) map[parent] = [];
        map[parent].push(c);
        }

        return map;
    }, [commentsQuery.data]);

    return {
        comments: commentsQuery.data ?? [],
        tree,
        loading: commentsQuery.isLoading,
        error: commentsQuery.error,
        reload: commentsQuery.refetch,
        add,
        remove
    };
}