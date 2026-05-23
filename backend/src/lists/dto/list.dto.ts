import { IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateListDto {
  @ApiProperty({ type: String, example: 'Ma liste de travail' })
  @IsString()
  @MinLength(1, { message: 'Le nom ne peut pas être vide' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name: string;

  @ApiPropertyOptional({ type: String, example: '#3B82F6', description: 'List color in hex format' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'La couleur doit être au format hexadécimal (#RRGGBB)',
  })
  color?: string;
}

export class UpdateListDto {
  @ApiPropertyOptional({ type: String, example: 'Nouveau nom' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ type: String, example: '#3B82F6', description: 'List color in hex format' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'La couleur doit être au format hexadécimal (#RRGGBB)',
  })
  color?: string;
}
