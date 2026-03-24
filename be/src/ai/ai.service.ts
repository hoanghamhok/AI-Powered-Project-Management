import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GeminiService } from 'src/gemini/gemini.service';

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
  ) {}

  async ask(question: string, projectId: string) {
    if (!question) {
        throw new Error("question is required");
    }

    const lowerQ = question.toLowerCase();

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
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
      const doing = project.columns.find(c =>
        c.title.toLowerCase().includes("doing"),
      );
      return doing
        ? `Có ${doing.tasks.length} task đang làm`
        : "Không có cột DOING";
    }

    //context cho AI

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

//gọi AI

    return this.gemini.generate(prompt);
  }
}