import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ROLES = ['viewer', 'editor', 'admin'] as const;

export class ShareListDto {
  @ApiProperty({ example: 'collegue@example.com' })
  @IsEmail({}, { message: 'Email invalide' })
  invitedEmail: string;

  @ApiPropertyOptional({ enum: ROLES, example: 'editor' })
  @IsOptional()
  @IsString()
  @IsIn(ROLES, { message: 'Rôle invalide (viewer, editor, admin)' })
  role?: string;

  @ApiPropertyOptional({ enum: ROLES, deprecated: true })
  @IsOptional()
  @IsString()
  @IsIn(ROLES)
  shareRole?: string;
}

export function resolveShareRole(dto: ShareListDto): string {
  return dto.role ?? dto.shareRole ?? 'viewer';
}
