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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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

  @Get('lists/:listId/tasks')
  @ApiOperation({ summary: 'Récupérer toutes les tâches d\'une liste' })
  findAll(@Param('listId') listId: string, @CurrentUser('id') userId: string) {
    return this.tasksService.findAllByList(listId, userId);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Récupérer une tâche par son ID' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tasksService.findOne(id, userId);
  }

  @Post('lists/:listId/tasks')
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
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    const task = await this.tasksService.update(id, dto, userId);
    this.tasksGateway.emitTaskUpdated(task.listId, task);
    return task;
  }

  @Patch('tasks/:id/toggle')
  @ApiOperation({ summary: 'Basculer l\'état terminé/actif d\'une tâche' })
  async toggleComplete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const task = await this.tasksService.toggleComplete(id, userId);
    this.tasksGateway.emitTaskCompleted(task.listId, task);
    return task;
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une tâche' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const task = await this.tasksService.findOne(id, userId);
    const result = await this.tasksService.remove(id, userId);
    this.tasksGateway.emitTaskDeleted(task.listId, id);
    return result;
  }
}
