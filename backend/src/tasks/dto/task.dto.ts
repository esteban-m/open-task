import { IsString, IsOptional, IsDateString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ example: 'Finaliser le rapport Q4' })
  @IsString()
  @MinLength(1, { message: 'La description courte ne peut pas être vide' })
  @MaxLength(200)
  shortDescription: string;

  @ApiPropertyOptional({ example: 'Inclure les chiffres de vente et les projections...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  longDescription?: string;

  @ApiProperty({ example: '2024-12-31' })
  @IsDateString({}, { message: "La date d'échéance est invalide" })
  dueDate: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  longDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Déplacer la tâche vers une autre liste' })
  @IsOptional()
  @IsUUID('4', { message: 'listId invalide' })
  listId?: string;
}
