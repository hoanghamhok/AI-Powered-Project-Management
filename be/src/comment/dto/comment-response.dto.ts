export class CommentResponseDto {
  id: string
  content: string
  taskId: string
  authorId: string
  parentId?: string
  createdAt: Date
}