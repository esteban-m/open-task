import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ type: String, example: 'Jean' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ type: String, example: 'Dupont' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ type: String, example: 'jean.dupont@email.com' })
  @IsEmail({}, { message: "L'adresse email est invalide" })
  email: string;

  @ApiProperty({ type: String, example: 'motdepasse123' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string;
}

export class LoginDto {
  @ApiProperty({ type: String, example: 'jean.dupont@email.com' })
  @IsEmail({}, { message: "L'adresse email est invalide" })
  email: string;

  @ApiProperty({ type: String, example: 'motdepasse123' })
  @IsString()
  password: string;
}
