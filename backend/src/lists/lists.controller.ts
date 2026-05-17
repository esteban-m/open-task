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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lists')
export class ListsController {
  constructor(private listsService: ListsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les listes de l\'utilisateur' })
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
  update(
    @Param('id') id: string,
    @Body() dto: UpdateListDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.listsService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une liste et toutes ses tâches' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.listsService.remove(id, userId);
  }
}
