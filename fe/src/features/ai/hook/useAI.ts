import { useMutation } from "@tanstack/react-query";
import { askAI } from "../ai.api";

export const useAI = () => {
  return useMutation({
    mutationFn: ({
      question,
      projectId,
    }: {
      question: string;
      projectId: string;
    }) => askAI(question, projectId),
  });
};