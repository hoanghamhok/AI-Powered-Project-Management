import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GeminiService } from 'src/gemini/gemini.service';

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
  ) {}

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

    const summary = await this.gemini.generate(prompt);

    // Save summary to database
    await this.prisma.project.update({
      where: { id: projectId },
      data: { summary },
    });

    return summary;
  }

  async ask(question: string, projectId: string) {
    if (!question) {
      throw new Error("question is required");
    }

    const lowerQ = question.toLowerCase();

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: true,
          }
        },
        columns: {
          include: {
            tasks: {
              include: {
                assignees: true,
              },
            },
          },
        },
      },
    });

    if (!project) return "Project not found";

    // Bao nhiêu người
    if (lowerQ.includes("bao nhiêu người") || lowerQ.includes("how many members")) {
      return `Project có ${project.members.length} người`;
    }

    // Bao nhiêu task
    if (lowerQ.includes("bao nhiêu task")) {
      const total = project.columns.reduce(
        (sum, col) => sum + col.tasks.length,
        0,
      );
      return `Project có ${total} tasks`;
    }

    // Task đang làm (DOING)
    if (lowerQ.includes("đang làm") || lowerQ.includes("doing")) {
      const doing = project.columns.find((c) =>
        c.title.toLowerCase().includes("doing"),
      );
      return doing
        ? `Có ${doing.tasks.length} task đang làm`
        : "Không có cột DOING";
    }

    // context cho AI
    const context = JSON.stringify(project, null, 2);
    const prompt = `
  You are an AI assistant for a Kanban project.

  Project data (JSON):
  ${context}

  Instructions:
  - Answer ONLY based on data
  - You can count, filter, compare
  - Understand:
    - members
    - tasks
    - columns
    - assignees
  - Be concise

  User question:
  ${question}
  `;

    // gọi AI
    return this.gemini.generate(prompt);
  }
}