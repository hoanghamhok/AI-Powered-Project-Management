import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Request,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { CreateManyTasksDto } from './dto/create-tasks.dto';
import { RiskPredictionService } from '../risk-prediction/risk-prediction.service';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService,private riskPredictionService: RiskPredictionService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAllTasks(@Request() req) {
    return this.tasksService.getAll(req.user.role);
  }

  @Get('my-tasks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMyTasks(@Request() req) {
    return this.tasksService.getTasksByUserId(req.user.userId);
  }

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getByProjectID(@Param('projectId') projectId: string, @Request() req) {
    return this.tasksService.getTasksByProjectId(projectId, req.user.userId, req.user.role);
  }

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getByID(@Param('id') id: string, @Request() req) {
    return this.tasksService.getTaskByID(id, req.user.userId, req.user.role);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user.userId, req.user.role);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  bulkCreate(@Body() createManyTasksDto: CreateManyTasksDto, @Request() req) {
    return this.tasksService.bulkCreate(createManyTasksDto, req.user.userId, req.user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    const updatedTask = await this.tasksService.update(id, updateTaskDto, req.user.userId, req.user.role);
    const newRiskScore = await this.riskPredictionService.getRiskScore(id);
    return {
      ...updatedTask,
      riskScore: newRiskScore,
    }
  }

  @Patch(':id/move')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  moveTask(
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
    @Request() req,
  ) {
    return this.tasksService.moveTask(
      id,
      dto.columnId,
      req.user.userId,
      dto.beforeTaskId,
      dto.afterTaskId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string, @Request() req) {
    return this.tasksService.remove(id, req.user.userId, req.user.role);
  }
}
