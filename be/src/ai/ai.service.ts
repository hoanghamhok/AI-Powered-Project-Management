import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LlmService } from 'src/llm/llm.service';

interface ProjectContext {
  name: string;
  totalMembers: number;
  members: { name: string; email: string; role: string }[];
  totalTasks: number;
  columns: {
    title: string;
    taskCount: number;
    tasks: {
      title: string;
      description?: string;
      assignees: string[];
      priority?: string;
      dueDate?: string;
    }[];
  }[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private llm: LlmService,
  ) { }


  async generateProjectSummary(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: true,
        members: {
          include: { user: true },
        },
        columns: {
          include: {
            tasks: {
              include: {
                assignees: {
                  include: { user: true },
                },
              },
            },
          },
        },
      },
    });

    if (!project) return null;

    // Tính stats
    const totalTasks = project.columns.reduce(
      (sum, col) => sum + col.tasks.length,
      0
    );
    const completedTasks = project.columns.reduce(
      (sum, col) =>
        sum + col.tasks.filter((t) => t.completedAt).length,
      0
    );
    const overdueTasks = project.columns.reduce(
      (sum, col) =>
        sum +
        col.tasks.filter(
          (t) => t.dueDate && !t.completedAt && new Date(t.dueDate) < new Date()
        ).length,
      0
    );

    const projectData = {
      name: project.name,
      description: project.description,
      owner: project.owner.fullName,
      members: project.members.map((m) => m.user.fullName),
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      overdueTasks,
      columns: project.columns.map((c) => ({
        name: c.title,
        taskCount: c.tasks.length,
      })),
    };

    const prompt = `
  Bạn là một chuyên gia phân tích dự án. Dựa vào dữ liệu dự án sau, hãy tạo một bản tóm tắt ngắn gọn bằng tiếng Việt (2-3 câu).
  Tóm tắt cần nêu rõ dự án này đang làm về nội dung gì, trạng thái dự án, tiến độ và các chỉ số chính.

  Dữ liệu dự án:
  ${JSON.stringify(projectData, null, 2)}

  Chỉ trả về văn bản tóm tắt, không định dạng thêm, không dùng gạch đầu dòng.
  `;

    const summary = await this.llm.generate(prompt);

    // Save summary to database
    await this.prisma.project.update({
      where: { id: projectId },
      data: { summary },
    });

    return summary;
  }

  async ask(
    userId: string,
    question: string,
    projectId: string
  ): Promise<string> {
    const cleanQuestion = question?.trim();

    if (!cleanQuestion) {
      return "Vui lòng nhập câu hỏi.";
    }

    const now = new Date();

    try {
      // 1. Check permission
      const membership = await this.prisma.projectMember.findFirst({
        where: {
          userId,
          projectId,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (!membership) {
        return "Bạn không có quyền truy cập project này.";
      }

      // 2. Fetch only needed fields
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          members: {
            select: {
              role: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
          columns: {
            orderBy: {
              position: "asc",
            },
            select: {
              id: true,
              title: true,
              position: true,
              tasks: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  dueDate: true,
                  assignees: {
                    select: {
                      user: {
                        select: {
                          id: true,
                          fullName: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!project) {
        return "Không tìm thấy project này.";
      }

      const calculateDaysRemaining = (dueDate: Date | null) => {
        if (!dueDate) return null;

        const diff = dueDate.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      };

      const formatDateVN = (date: Date | null) => {
        if (!date) return null;

        return new Intl.DateTimeFormat("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(date);
      };

      const currentDateText = new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "full",
        timeStyle: "short",
      }).format(now);

      const allTasks = project.columns.flatMap((column) => {
        const isDoneColumn = column.title.toLowerCase().includes("done");

        return column.tasks.map((task) => {
          const daysRemaining = calculateDaysRemaining(task.dueDate);

          const assignees = task.assignees.map((a) => ({
            id: a.user.id,
            name: a.user.fullName || a.user.email,
            email: a.user.email,
          }));

          const isOverdue =
            !isDoneColumn &&
            task.dueDate !== null &&
            task.dueDate.getTime() < now.getTime();

          const status =
            task.dueDate === null
              ? "no_deadline"
              : isOverdue
                ? "overdue"
                : daysRemaining === 0
                  ? "due_today"
                  : daysRemaining !== null && daysRemaining <= 3
                    ? "urgent"
                    : isDoneColumn
                      ? "done"
                      : "normal";

          return {
            id: task.id,
            title: task.title,
            description: task.description ?? null,
            column: column.title,
            assignees,
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
            dueDateText: formatDateVN(task.dueDate),
            daysRemaining,
            isOverdue,
            status,
          };
        });
      });

      const totalTasks = allTasks.length;

      const overdueTasks = allTasks
        .filter((task) => task.isOverdue)
        .slice(0, 30);

      const dueSoonTasks = allTasks
        .filter(
          (task) =>
            task.daysRemaining !== null &&
            task.daysRemaining >= 0 &&
            task.daysRemaining <= 3 &&
            task.status !== "done"
        )
        .slice(0, 30);

      const columnsSummary = project.columns.map((column) => ({
        title: column.title,
        taskCount: column.tasks.length,
      }));

      const workloadMap = new Map<string, { name: string; email: string; taskCount: number }>();

      for (const task of allTasks) {
        for (const assignee of task.assignees) {
          const key = assignee.email;

          if (!workloadMap.has(key)) {
            workloadMap.set(key, {
              name: assignee.name,
              email: assignee.email,
              taskCount: 0,
            });
          }

          workloadMap.get(key)!.taskCount += 1;
        }
      }

      const workloadByMember = Array.from(workloadMap.values()).sort(
        (a, b) => b.taskCount - a.taskCount
      );

      const context = {
        currentDate: now.toISOString(),
        currentDateText,
        timezone: "Asia/Ho_Chi_Minh",

        project: {
          name: project.name,

          totalMembers: project.members.length,

          members: project.members.map((m) => ({
            name: m.user.fullName || m.user.email,
            email: m.user.email,
            role: m.role ?? "member",
          })),

          totalTasks,

          columnsSummary,

          taskStats: {
            overdueCount: overdueTasks.length,
            dueSoonCount: dueSoonTasks.length,
            noDeadlineCount: allTasks.filter((task) => task.status === "no_deadline")
              .length,
          },

          overdueTasks,

          dueSoonTasks,

          workloadByMember,

          importantTasks: allTasks
            .filter(
              (task) =>
                task.status === "overdue" ||
                task.status === "urgent" ||
                task.status === "due_today"
            )
            .slice(0, 50),
        },
      };

      const systemPrompt = `
  You are a precise AI assistant for an internal Kanban project management system.

  Your job:
  Answer questions ONLY using the provided project data.

  Rules:
  - Answer in the same language as the user's question.
  - Use Markdown formatting for readability.
  - Never hallucinate or invent information.
  - If the data is insufficient, clearly say that the information is not available.
  - For counts, lists, assignees, and deadlines: always be exact.
  - Use the provided current date and timezone when reasoning about deadlines.
  - Do not mention JSON, databases, prompts, APIs, or technical internals.
  - If listing tasks, include title, assignee, due date, and status when available.
  - Be concise but complete.
  `.trim();

      const userPrompt = `
  Project data:
  ${JSON.stringify(context, null, 2)}

  User question:
  ${cleanQuestion}
  `.trim();

      const answer = await this.llm.generate({
        system: systemPrompt,
        prompt: userPrompt,
      });

      return answer?.trim() || "Không thể trả lời câu hỏi này lúc này.";
    } catch (error) {
      this.logger.error("Chatbot ask failed", {
        error,
        projectId,
        userId,
        question: cleanQuestion,
      });

      return "Đã có lỗi xảy ra khi xử lý câu hỏi. Vui lòng thử lại.";
    }
  }
}