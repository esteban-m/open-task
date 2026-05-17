import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/** Valide uniquement les chaînes au format couleur hex (#RGB / #RRGGBB). */
@Injectable()
export class ColorValidationPipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    if (value === undefined || value === null) {
      return value;
    }

    // Corps JSON, DTO, etc. — ne pas toucher
    if (typeof value !== 'string') {
      return value;
    }

    // Texte normal (nom de liste, email, uuid…) — laisser passer
    if (!value.startsWith('#')) {
      return value;
    }

    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    if (!hexPattern.test(value)) {
      throw new BadRequestException(
        'Format de couleur invalide. Utilisez #RRGGBB ou #RGB.',
      );
    }

    let hex = value.substring(1);

    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((char) => char + char)
        .join('');
    }

    return `#${hex.toLowerCase()}`;
  }
}
