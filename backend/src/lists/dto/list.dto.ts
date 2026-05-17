import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateListDto {
  @ApiProperty({ example: 'Ma liste de travail' })
  @IsString()
  @MinLength(1, { message: 'Le nom ne peut pas être vide' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name: string;
}

export class UpdateListDto {
  @ApiProperty({ example: 'Nouveau nom' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
