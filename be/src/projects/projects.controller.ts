import { Controller, Get, Patch, Post, Delete, Request, Body, Param, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
    constructor(private projectsService: ProjectsService) { }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('my')
    getMyProjects(@Request() req) {
        return this.projectsService.getUsersProjects(req.user.userId)
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('all')
    getAllProjects() {
        return this.projectsService.getAllProjects();
    }


    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get(':id')
    async getProjectByID(@Param('id') id: string) {
        return this.projectsService.getProjectByID(id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('')
    async createProject(@Body() data: CreateProjectDto) {
        return this.projectsService.createProject(data);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Patch(':id/update')
    async updateProject(@Param('projectId') projectId: string, @Request() req, @Body() dto: UpdateProjectDto) {
        return this.projectsService.updateProject(projectId, req.user.userId, dto)
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete('/:projectId')
    async deleteProject(@Param('projectId') projectId: string, @Request() req) {
    return this.projectsService.deleteProject(projectId, req.user.userId);
    }
}
