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

  async ask(question: string, projectId: string): Promise<string> {
    if (!question?.trim()) {
      throw new Error("question is required");
    }

    // timezone VN
    const now = new Date();

    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: {
            include: {
              user: true,
            },
          },
          columns: {
            orderBy: {
              position: "asc",
            },
            include: {
              tasks: {
                include: {
                  assignees: {
                    include: {
                      user: true,
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

      // helper tính số ngày còn lại
      const calculateDaysRemaining = (dueDate: Date | null) => {
        if (!dueDate) return null;

        const diff = dueDate.getTime() - now.getTime();

        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      };

      // helper xác định overdue
      const isOverdue = (dueDate: Date | null) => {
        if (!dueDate) return false;

        return dueDate.getTime() < now.getTime();
      };

      // Distill clean context cho AI
      const context = {
        currentDate: now.toISOString(),
        timezone: "Asia/Ho_Chi_Minh",

        project: {
          name: project.name,

          totalMembers: project.members.length,

          members: project.members.map((m) => ({
            name: m.user.fullName,
            email: m.user.email,
            role: m.role ?? "member",
          })),

          totalTasks: project.columns.reduce(
            (sum, col) => sum + col.tasks.length,
            0
          ),

          columns: project.columns.map((col) => ({
            title: col.title,

            taskCount: col.tasks.length,

            tasks: col.tasks.map((t) => {
              const daysRemaining = calculateDaysRemaining(t.dueDate);

              return {
                title: t.title,

                description: t.description ?? null,

                assignees: t.assignees.map(
                  (a) => a.user.fullName || a.user.email
                ),

                dueDate: t.dueDate
                  ? t.dueDate.toISOString()
                  : null,

                isOverdue: isOverdue(t.dueDate),

                daysRemaining,

                status:
                  daysRemaining === null
                    ? "no_deadline"
                    : daysRemaining < 0
                      ? "overdue"
                      : daysRemaining === 0
                        ? "due_today"
                        : daysRemaining <= 3
                          ? "urgent"
                          : "normal",
              };
            }),
          })),
        },
      };

      const systemPrompt = `
    You are a precise AI assistant for Kanban project management.

    Current datetime:
    ${now.toISOString()}

    Timezone:
    Asia/Ho_Chi_Minh

    Your job:
    Answer questions ONLY using the provided project data.

    Rules:
    - Answer in the same language as the user's question.
    - Use Markdown formatting for better readability (bold, lists, tables).
    - Never hallucinate or invent information.
    - Be concise but clear.
    - For counts/lists/deadlines: always be exact.
    - Use bullet points for multiple items.
    - Use the provided current datetime when reasoning about deadlines.
    - If the data is insufficient, explicitly say so.
    - Do NOT mention JSON, databases, or technical internals.
    - Never stop mid-sentence.
    - Ensure the answer is complete.
    `.trim();

      const userPrompt = `
    ## Project Data

    \`\`\`json
    ${JSON.stringify(context, null, 2)}
    \`\`\`

    ## User Question

    ${question.trim()}
    `.trim();

      const answer = await this.llm.generate({
        system: systemPrompt,
        prompt: userPrompt,
      });

      return (
        answer?.trim() ||
        "Không thể trả lời câu hỏi này lúc này."
      );
    } catch (error) {
      this.logger.error("LLM generation failed", {
        error,
        projectId,
        question,
      });

      return "Đã có lỗi xảy ra khi xử lý câu hỏi. Vui lòng thử lại.";
    }
  }
}