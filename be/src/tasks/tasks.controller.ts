import {Controller,Get,Patch,Post,Delete,Request,Body, Param,UseGuards} from '@nestjs/common';
import {ApiTags, ApiBearerAuth} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController{
    constructor(private tasksService:TasksService){}
    
    @Get('')
    async getTask(){
        return this.tasksService.getAll();
    }

    @Post('')
    create(@Body() createTaskDto:CreateTaskDto){
        return this.tasksService.create(createTaskDto);
    }

    @Patch(':id')
    update (@Param('id') id:string,@Body() updateTaskDto:UpdateTaskDto){
        return this.tasksService.update(id,updateTaskDto)
    }

    @Patch(':id/move')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    moveTask(@Param('id') id: string,@Body() dto: MoveTaskDto,@Request() req) {
        return this.tasksService.moveTask(id,dto.columnId,req.user.userId,dto.beforeTaskId,dto.afterTaskId,);
    }

    @Delete(':id')
    remove(@Param('id') id:string){
        return this.tasksService.remove(id);
    }
    
    @Get(':id')
    getByID(@Param('id') id:string){
        return this.tasksService.getTasksByUserId(id);
    }
    @Get('project/:projectId')
    getByProjectID(@Param('projectId') projectId:string){
        return this.tasksService.getTasksByProjectId(projectId);
    }
}