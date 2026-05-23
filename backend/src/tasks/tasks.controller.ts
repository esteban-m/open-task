import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { TasksGateway } from './tasks.gateway';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(
    private tasksService: TasksService,
    private tasksGateway: TasksGateway,
  ) {}

  @Get('tasks')
  @ApiOperation({ summary: 'Récupérer toutes les tâches de l\'utilisateur' })
  findAllForUser(@CurrentUser('id') userId: string) {
    return this.tasksService.findAllForUser(userId);
  }

  @Get('lists/:listId/tasks')
  @ApiParam({ name: 'listId', description: 'ID de la liste' })
  @ApiOperation({ summary: 'Récupérer toutes les tâches d\'une liste' })
  findAll(@Param('listId') listId: string, @CurrentUser('id') userId: string) {
    return this.tasksService.findAllByList(listId, userId);
  }

  @Get('tasks/:id')
  @ApiParam({ name: 'id', description: 'ID de la tâche' })
  @ApiOperation({ summary: 'Récupérer une tâche par son ID' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.findOne(id, userId);
  }

  @Post('lists/:listId/tasks')
  @ApiParam({ name: 'listId', description: 'ID de la liste' })
  @ApiBody({ type: () => CreateTaskDto })
  @ApiOperation({ summary: 'Créer une tâche dans une liste' })
  async create(
    @Param('listId') listId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    const task = await this.tasksService.create(listId, dto, userId);
    this.tasksGateway.emitTaskCreated(listId, task);
    return task;
  }

  @Put('tasks/:id')
  @ApiParam({ name: 'id', description: 'ID de la tâche' })
  @ApiBody({ type: () => UpdateTaskDto })
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    const { task, previousListId } = await this.tasksService.update(id, dto, userId);
    if (dto.listId && previousListId !== task.listId) {
      this.tasksGateway.emitTaskMoved(previousListId, task.listId, task);
    } else {
      this.tasksGateway.emitTaskUpdated(task.listId, task);
    }
    return task;
  }

  @Patch('tasks/:id/toggle')
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'ID de la tâche' })
  @ApiOperation({ summary: 'Basculer l\'état terminé/actif d\'une tâche' })
  async toggleComplete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const task = await this.tasksService.toggleComplete(id, userId);
    this.tasksGateway.emitTaskCompleted(task.listId, task);
    return task;
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'ID de la tâche' })
  @ApiOperation({ summary: 'Supprimer une tâche' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const task = await this.tasksService.findOne(id, userId);
    const result = await this.tasksService.remove(id, userId);
    this.tasksGateway.emitTaskDeleted(task.listId, id);
    return result;
  }
}
