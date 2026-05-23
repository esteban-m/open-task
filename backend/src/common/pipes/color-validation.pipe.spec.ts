import { BadRequestException } from '@nestjs/common';
import { ColorValidationPipe } from './color-validation.pipe';

describe('ColorValidationPipe', () => {
  const pipe = new ColorValidationPipe();

  it('returns null, undefined and non-string values unchanged', () => {
    expect(pipe.transform(null, {} as any)).toBeNull();
    expect(pipe.transform(undefined, {} as any)).toBeUndefined();
    expect(pipe.transform(42, {} as any)).toBe(42);
  });

  it('passes through non-color strings', () => {
    expect(pipe.transform('Ma liste', {} as any)).toBe('Ma liste');
    expect(pipe.transform('user@mail.com', {} as any)).toBe('user@mail.com');
  });

  it('normalizes #RGB to #RRGGBB lowercase', () => {
    expect(pipe.transform('#ABC', {} as any)).toBe('#aabbcc');
  });

  it('accepts #RRGGBB', () => {
    expect(pipe.transform('#3B82F6', {} as any)).toBe('#3b82f6');
  });

  it('rejects invalid hex colors', () => {
    expect(() => pipe.transform('#GGGGGG', {} as any)).toThrow(BadRequestException);
  });
});
