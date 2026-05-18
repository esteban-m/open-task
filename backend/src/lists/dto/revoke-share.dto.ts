import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RevokeShareDto {
  @ApiProperty({ description: 'ID de l\'utilisateur dont l\'accès est révoqué' })
  @IsUUID('4', { message: 'userIdToRevoke doit être un UUID valide' })
  userIdToRevoke: string;
}
