import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../api/client";

export const useGenerateSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await api.post(`/projects/${projectId}/generate-summary`);
      return response.data;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
