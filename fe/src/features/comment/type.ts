import type { paths } from "../../types/openapi"

export type CreateCommentRequest =
  paths["/tasks/{taskId}/comments"]["post"]["requestBody"]["content"]["application/json"];

export type GetTaskCommentsResponse =
  paths["/tasks/{taskId}/comments"]["get"]["responses"]["200"]["content"]["application/json"];

export interface Comment {
  id: string
  content: string
  parentId?: string | null
  author: {
    id: string
    fullName: string
    avatarUrl?: string | null
  }
  replies: Comment[]
  mentions: string[]
  createdAt: string
}