import { validateProductionSecrets } from './validate-production-secrets';

describe('validateProductionSecrets', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('no-op outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'changeme';
    expect(() => validateProductionSecrets()).not.toThrow();
  });

  it('allows skip flag in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.SKIP_PRODUCTION_SECRET_CHECK = 'true';
    process.env.JWT_SECRET = 'short';
    expect(() => validateProductionSecrets()).not.toThrow();
  });

  it('throws when secrets are weak in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SKIP_PRODUCTION_SECRET_CHECK;
    process.env.JWT_SECRET = 'changeme_jwt';
    process.env.JWT_REFRESH_SECRET = 'changeme_refresh';
    expect(() => validateProductionSecrets()).toThrow(/JWT_SECRET/);
  });

  it('traite les secrets absents comme vides en production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SKIP_PRODUCTION_SECRET_CHECK;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => validateProductionSecrets()).toThrow(/JWT_SECRET/);
  });

  it('accepts strong secrets in production', () => {
    process.env.NODE_ENV = 'production';
    const strong = 'a'.repeat(40);
    process.env.JWT_SECRET = strong;
    process.env.JWT_REFRESH_SECRET = strong + 'b';
    expect(() => validateProductionSecrets()).not.toThrow();
  });
});
