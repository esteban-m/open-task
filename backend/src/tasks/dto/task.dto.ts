import { IsString, IsOptional, IsDateString, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ type: String, example: 'Finaliser le rapport Q4' })
  @IsString()
  @MinLength(1, { message: 'La description courte ne peut pas être vide' })
  @MaxLength(200)
  shortDescription: string;

  @ApiPropertyOptional({ type: String, example: 'Inclure les chiffres de vente et les projections...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  longDescription?: string;

  @ApiProperty({ type: String, example: '2024-12-31' })
  @IsDateString({}, { message: "La date d'échéance est invalide" })
  dueDate: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  shortDescription?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  longDescription?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ type: String, description: 'Déplacer la tâche vers une autre liste' })
  @IsOptional()
  @IsUUID('4', { message: 'listId invalide' })
  listId?: string;
}
