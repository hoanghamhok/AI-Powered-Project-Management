import api from "../../../api/client";
import type { CreateCommentRequest } from "../type";

export const createComment = (taskId: string,data: CreateCommentRequest) => 
    api.post(`/tasks/${taskId}/comments`, data);

export const getTaskComments = (taskId: string) =>
    api.get(`/tasks/${taskId}/comments`);

export const deleteComment = (id:string) =>
    api.delete(`/comments/${id}`)