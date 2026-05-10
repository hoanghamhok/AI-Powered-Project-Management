import {Controller,Get,Post,Patch,Param,Body,Delete,UseGuards,Request} from "@nestjs/common";
import { ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import { ColumnsService } from "./columns.service";
import { CreateColumnDto } from "./dto/create-column.dto";
import { UpdateColumnDto } from "./dto/update-column.dto";
import { MoveColumnDto } from "./dto/move-column.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";

@ApiTags("Columns")
@Controller("columns")
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('')
  async getTask(@Request() req){
    return this.columnsService.getAll(req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("project/:projectId")
  getByProject(@Param("projectId") projectId: string, @Request() req) {
    return this.columnsService.getByProject(projectId, req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("project/")
  create(@Body() dto: CreateColumnDto, @Request() req) {
    return this.columnsService.create(dto, req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(":id")
  update(@Param("id") id: string,@Body() dto: UpdateColumnDto, @Request() req) {
    if (dto.closed === true) {
      return this.columnsService.close(id, req.user.userId, req.user.role);
    }
    return this.columnsService.update(id, dto, req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/move')
  move(
    @Param('id') id: string,
    @Body() body: MoveColumnDto,
    @Request() req,
  ) {
    return this.columnsService.move(
      id,
      body.beforeColumnId,
      body.afterColumnId,
      req.user.userId,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(":id/close")
  close(@Param("id") id: string, @Request() req) {
    return this.columnsService.close(id, req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
      remove(@Param('id') id:string, @Request() req){
          return this.columnsService.remove(id, req.user.userId, req.user.role);
  }
}
