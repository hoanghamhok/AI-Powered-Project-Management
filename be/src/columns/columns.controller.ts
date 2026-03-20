import {Controller,Get,Post,Patch,Param,Body,Delete} from "@nestjs/common";
import { ApiTags} from "@nestjs/swagger";
import { ColumnsService } from "./columns.service";
import { CreateColumnDto } from "./dto/create-column.dto";
import { UpdateColumnDto } from "./dto/update-column.dto";

@ApiTags("Columns")
@Controller("columns")
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Get('')
  async getTask(){
    return this.columnsService.getAll();
  }

  @Get("project/:projectId")
  getByProject(@Param("projectId") projectId: string) {
    return this.columnsService.getByProject(projectId);
  }

  @Post("project/")
  create(@Body() dto: CreateColumnDto) {
    return this.columnsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string,@Body() dto: UpdateColumnDto,) {
    if (dto.closed === true) {
      return this.columnsService.close(id);
    }
    return this.columnsService.update(id, dto);
  }

  @Patch(":id/move")
  move(@Param("id") id: string,@Body()body: {
      beforeColumnId?: string;
      afterColumnId?: string;
    },
  ) {
    return this.columnsService.move(
      id,
      body.beforeColumnId,
      body.afterColumnId,
    );
  }

  @Patch(":id/close")
  close(@Param("id") id: string) {
    return this.columnsService.close(id);
  }

  @Delete(':id')
      remove(@Param('id') id:string){
          return this.columnsService.remove(id);
  }
}
