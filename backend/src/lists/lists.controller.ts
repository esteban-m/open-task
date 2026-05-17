import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ListsService } from './lists.service';
import { CreateListDto, UpdateListDto } from './dto/list.dto';
import { ShareListDto, resolveShareRole } from './dto/share-list.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TasksGateway } from '../tasks/tasks.gateway';

@ApiTags('lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lists')
export class ListsController {
  constructor(
    private listsService: ListsService,
    private tasksGateway: TasksGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les listes (possédées + partagées)' })
  findAll(@CurrentUser('id') userId: string) {
    return this.listsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une liste par son ID' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.listsService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle liste' })
  create(@Body() dto: CreateListDto, @CurrentUser('id') userId: string) {
    return this.listsService.create(dto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une liste' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateListDto,
    @CurrentUser('id') userId: string,
  ) {
    const list = await this.listsService.update(id, dto, userId);
    this.tasksGateway.emitListUpdated(id, list);
    return list;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une liste et toutes ses tâches' })
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const members = await this.listsService.getSharedUsers(id, userId).catch(() => []);
    const result = await this.listsService.remove(id, userId);
    const memberIds = members.map((m: { id: string }) => m.id);
    this.tasksGateway.emitListDeleted(id, memberIds);
    return result;
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Partager une liste avec un email' })
  async shareList(
    @Param('id') listId: string,
    @Body() dto: ShareListDto,
    @CurrentUser('id') userId: string,
  ) {
    const { membership, list } = await this.listsService.shareList(
      listId,
      { invitedEmail: dto.invitedEmail, role: resolveShareRole(dto) },
      userId,
    );
    this.tasksGateway.emitListShared(membership.userId, list);
    return list;
  }

  @Post('shares/:id/accept')
  @ApiOperation({ summary: 'Accepter une invitation de partage' })
  acceptShare(@Param('id') shareId: string, @CurrentUser('id') userId: string) {
    return this.listsService.acceptShare(shareId, userId);
  }

  @Delete('shares/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Révoquer l\'accès (legacy)' })
  async revokeAccessLegacy(
    @Param('id') listId: string,
    @Body() dto: { userIdToRevoke: string },
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.listsService.revokeAccess(listId, dto.userIdToRevoke, userId);
    this.tasksGateway.emitListRevoked(dto.userIdToRevoke, listId);
    return result;
  }

  @Delete(':id/share/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Révoquer l\'accès d\'un utilisateur à une liste' })
  async revokeShare(
    @Param('id') listId: string,
    @Param('userId') userIdToRevoke: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.listsService.revokeAccess(listId, userIdToRevoke, userId);
    this.tasksGateway.emitListRevoked(userIdToRevoke, listId);
    return result;
  }

  @Get(':id/shared-users')
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs ayant accès à une liste' })
  getSharedUsers(@Param('id') listId: string, @CurrentUser('id') userId: string) {
    return this.listsService.getSharedUsers(listId, userId);
  }
}
