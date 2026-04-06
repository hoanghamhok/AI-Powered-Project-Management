import {ForbiddenException,Injectable,NotFoundException} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ActivityLogService } from 'src/activity-log/activity-log.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService,
              private activityLogService:ActivityLogService,) {}

    async getTaskComments(taskId: string) {
        const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        });

        if (!task) throw new NotFoundException('Task not found');

        return this.prisma.comment.findMany({
        where: {
            taskId,
            deletedAt: null,
        },
        include: {
            author: {
            select: {
                id: true,
                fullName: true,
                avatarUrl: true,
            },
            },
            replies: {
            where: { deletedAt: null },
            include: {
                author: {
                select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                },
                },
            },
            },
            mentions: {
                include: {
                user: true
                }
            }
        },
        orderBy: {
            createdAt: 'asc',
        },
        });
    }

    async createComment(taskId: string,userId: string,dto: CreateCommentDto,) {
        
    return this.prisma.$transaction(async (tx) => {
        const task = await tx.task.findUnique({
        where: { id: taskId },
        select: { id: true, projectId: true },
        });

        if (!task) {
        throw new NotFoundException('Task not found');
        }

        //check parent comment
        let parentComment:
        | { id: string; authorId: string; taskId: string }
        | null = null;

        if (dto.parentId) {
        parentComment = await tx.comment.findUnique({
            where: { id: dto.parentId },
            select: { id: true, authorId: true, taskId: true },
        });

        if (!parentComment) {
            throw new NotFoundException('Parent comment not found');
        }

        if (parentComment.taskId !== taskId) {
            throw new ForbiddenException(
            'Parent comment does not belong to this task',
            );
        }
        }

        //loại duplicate trước tránh 2 thông báo
        const mentionIds = [...new Set(dto.mentions ?? [])];

        let validMentionUsers: {
        id: string;
        fullName: string;
        avatarUrl: string | null;
        }[] = [];

        if (mentionIds.length > 0) {
        const projectMembers = await tx.projectMember.findMany({
            where: {
            projectId: task.projectId,
            userId: { in: mentionIds },
            },
            include: {
            user: {
                select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                },
            },
            },
        });

        validMentionUsers = projectMembers.map((m) => m.user);

        if (validMentionUsers.length !== mentionIds.length) {
            throw new ForbiddenException(
            'One or more mentioned users are not in this project',
            );
        }
        }

        // remove self + unique
        const uniqueMentions = [
        ...new Map(validMentionUsers.map((u) => [u.id, u])).values(),
        ].filter((u) => u.id !== userId);

        // 4. Create comment + include author
        const comment = await tx.comment.create({
        data: {
            content: dto.content,
            taskId,
            authorId: userId,
            parentId: dto.parentId ?? null,
        },
        include: {
            author: {
            select: {
                id: true,
                fullName: true,
                avatarUrl: true,
            },
            },
        },
        });

        // 5. Create CommentMention
        if (uniqueMentions.length > 0) {
        await tx.commentMention.createMany({
            data: uniqueMentions.map((u) => ({
            commentId: comment.id,
            userId: u.id,
            })),
            skipDuplicates: true,
        });
        }

        const notifications: Prisma.NotificationCreateManyInput[] = [];

        // Mention notification
        uniqueMentions.forEach((mentionedUser) => {
        notifications.push({
            userId: mentionedUser.id,
            type: 'COMMENT_MENTION',
            data: {
            message: `${comment.author.fullName} đã nhắc bạn trong 1 bình luận`,

            actorId: comment.author.id,
            actorName: comment.author.fullName,
            actorAvatar: comment.author.avatarUrl,

            commentId: comment.id,
            taskId,
            projectId: task.projectId,

            mentions: uniqueMentions.map((u) => ({
                id: u.id,
                name: u.fullName,
                avatar: u.avatarUrl,
            })),
            } as Prisma.InputJsonValue,
        });
        });

        // Reply notification (tránh duplicate)
        const isMentionedParentAuthor = uniqueMentions.some(
        (u) => u.id === parentComment?.authorId,
        );

        if (
        parentComment &&
        parentComment.authorId !== userId &&
        !isMentionedParentAuthor
        ) {
        notifications.push({
            userId: parentComment.authorId,
            type: 'COMMENT_REPLY',
            data: {
            message: `${comment.author.fullName} đã trả lời bình luận của bạn`,

            actorId: comment.author.id,
            actorName: comment.author.fullName,
            actorAvatar: comment.author.avatarUrl,

            commentId: comment.id,
            parentCommentId: parentComment.id,
            taskId,
            projectId: task.projectId,
            } as Prisma.InputJsonValue,
        });
        }

        // 7. Insert notifications
        if (notifications.length > 0) {
        await tx.notification.createMany({
            data: notifications,
        });
        }

        // 8. Activity log
        await this.activityLogService.log({
        userId,
        projectId: task.projectId,
        entityType: 'COMMENT',
        entityId: comment.id,
        action: 'COMMENT_CREATED',
        metadata: {
            taskId,
            content: dto.content,
            parentId: dto.parentId ?? null,
            mentions: uniqueMentions.map((u) => u.id),
            isReply: !!dto.parentId,
        },
        });

        return comment;
    });
    }

    async updateComment(commentId: string,userId: string,dto: UpdateCommentDto) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) throw new NotFoundException('Comment not found');

        if (comment.authorId !== userId)
            throw new ForbiddenException('You cannot edit this comment');

        return this.prisma.comment.update({
            where: { id: commentId },
            data: {
                content: dto.content,
            },
        });
    }

    async deleteComment(commentId: string, userId: string) {
        const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
        });

        if (!comment) throw new NotFoundException('Comment not found');

        if (comment.authorId !== userId)
            throw new ForbiddenException('You cannot delete this comment');

        return this.prisma.comment.update({
            where: { id: commentId },
            data: {
                deletedAt: new Date(),
            },
        });
    }
}