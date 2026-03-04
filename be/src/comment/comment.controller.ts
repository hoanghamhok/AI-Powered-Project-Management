import { Body,Controller,Delete,Get,Param,Patch,Post,Req,UseGuards} from '@nestjs/common';
import { CommentsService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiBody } from '@nestjs/swagger';
import { ApiResponse } from '@nestjs/swagger';
import { CommentResponseDto } from './dto/comment-response.dto';
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    type: CommentResponseDto,
    isArray: true,
  })
  @Get('tasks/:taskId/comments')
  getTaskComments(@Param('taskId') taskId: string) {
    return this.commentsService.getTaskComments(taskId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    type: CommentResponseDto,
  })
  @ApiBody({ type: CreateCommentDto })
  @Post('tasks/:taskId/comments')
  createComment(@Param('taskId') taskId: string,@Body() dto: CreateCommentDto,@Req() req,) {
    return this.commentsService.createComment(
      taskId,
      req.user.userId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('comments/:id')
  updateComment(@Param('id') id: string,@Body() dto: UpdateCommentDto,@Req() req,) {
    return this.commentsService.updateComment(
      id,
      req.user.userId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('comments/:id')
  deleteComment(@Param('id') id: string, @Req() req) {
    return this.commentsService.deleteComment(id, req.user.userId);
  }
}