import {Injectable,NotFoundException,ConflictException,ForbiddenException} from "@nestjs/common";
import { SystemRole } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateColumnDto } from "./dto/create-column.dto";
import { UpdateColumnDto } from "./dto/update-column.dto";

@Injectable()
export class ColumnsService {
  constructor(private prisma: PrismaService) {}

  private async assertProjectAccess(projectId: string, userId: string, role?: string) {
    if (role === SystemRole.SUPER_ADMIN) {
      return;
    }
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { id: true },
    });
    if (!member) {
      throw new ForbiddenException("You are not a member of this project");
    }
  }

  async getAll(role?: string) {
    if (role !== SystemRole.SUPER_ADMIN) {
      throw new ForbiddenException("Only SUPER_ADMIN can view all columns");
    }
    return this.prisma.column.findMany({
        orderBy: [
          { position: 'asc' },
        ],
      });
    }

  async getByProject(projectId: string, userId?: string, role?: string) {
    if (userId) {
      await this.assertProjectAccess(projectId, userId, role);
    }
    return this.prisma.column.findMany({
      where: {
        projectId,
      },
      orderBy: {
        position: "asc",
      },
    });
  }

  async create(dto: CreateColumnDto, userId: string, role?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) throw new NotFoundException("Project not found");
    await this.assertProjectAccess(dto.projectId, userId, role);
    const last = await this.prisma.column.findFirst({
      where: { projectId: dto.projectId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const nextPosition = last ? last.position + 1000 : 1000;

    return this.prisma.column.create({
      data: {
        title: dto.title,
        projectId: dto.projectId,
        position: nextPosition,
      },
    });
  }

  async update(id: string, dto: UpdateColumnDto, userId?: string, role?: string) {
    const column = await this.prisma.column.findUnique({
      where: { id },
    });
    if (!column) throw new NotFoundException("Column not found");
    if (userId) {
      await this.assertProjectAccess(column.projectId, userId, role);
    }

    return this.prisma.column.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  async move(columnId: string, beforeColumnId?: string, afterColumnId?: string, userId?: string, role?: string) {
    const column = await this.prisma.column.findUnique({ where: { id: columnId } });
    if (!column) throw new NotFoundException("Column not found");
    if (userId) {
      await this.assertProjectAccess(column.projectId, userId, role);
    }
    let newPosition: number;

    if (beforeColumnId && afterColumnId) {
      const [before, after] = await Promise.all([
        this.prisma.column.findUnique({ where: { id: beforeColumnId } }),
        this.prisma.column.findUnique({ where: { id: afterColumnId } }),
      ]);
      if (!before || !after || before.projectId !== column.projectId || after.projectId !== column.projectId) {
        throw new NotFoundException("Invalid column reference");
      }

      newPosition = (before.position + after.position) / 2;

    } else if (beforeColumnId) {
      const before = await this.prisma.column.findUnique({ where: { id: beforeColumnId } });
      if (!before || before.projectId !== column.projectId) throw new NotFoundException("Invalid column reference");

      newPosition = before.position + 1000;

    } else if (afterColumnId) {
      const after = await this.prisma.column.findUnique({ where: { id: afterColumnId } });
      if (!after || after.projectId !== column.projectId) throw new NotFoundException("Invalid column reference");

      newPosition = after.position / 2; // ✅ tránh âm

    } else {
      const last = await this.prisma.column.findFirst({
        where: { projectId: column.projectId, closed: false },
        orderBy: { position: "desc" },
      });
      newPosition = last ? last.position + 1000 : 1000;
    }

    return this.prisma.column.update({
      where: { id: columnId },
      data: { position: newPosition },
    });
  }

  async close(id: string, userId?: string, role?: string) {
    const column = await this.prisma.column.findUnique({
      where: { id },
    });
    if (!column) throw new NotFoundException("Column not found");
    if (userId) {
      await this.assertProjectAccess(column.projectId, userId, role);
    }

    const existingDoneColumn = await this.prisma.column.findFirst({
      where: {
        projectId: column.projectId,
        closed: true,
      },
    });

    if (existingDoneColumn) {
      throw new ConflictException("Only one column can be marked as DONE per project");
    }

    return this.prisma.column.update({
      where: { id },
      data: { closed: true },
    });
  }

  async getColumnByID(id:string){
        const column = await this.prisma.column.findUnique({where:{id}})
        if(!column){
            throw new NotFoundException();
        }
        return column;
  }

  async remove(id:string, userId?: string, role?: string){
    const column = await this.getColumnByID(id)
    if (userId) {
      await this.assertProjectAccess(column.projectId, userId, role);
    }
    return this.prisma.column.delete({
      where:{id}
    })
  }

}
