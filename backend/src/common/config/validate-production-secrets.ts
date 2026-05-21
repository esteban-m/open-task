const WEAK_SECRET_PATTERNS = [
  'changeme',
  'dev_jwt_secret',
  'dev_refresh_secret',
  'e2e_test',
  'ci_test',
  'opentask_secret',
];

export function validateProductionSecrets(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // Désactivable uniquement pour docker-compose local ; jamais en déploiement réel.
  if (process.env.SKIP_PRODUCTION_SECRET_CHECK === 'true') {
    return;
  }

  const jwtSecret = process.env.JWT_SECRET ?? '';
  const refreshSecret = process.env.JWT_REFRESH_SECRET ?? '';

  const isWeak = (value: string) =>
    value.length < 32 ||
    WEAK_SECRET_PATTERNS.some((pattern) => value.toLowerCase().includes(pattern));

  if (isWeak(jwtSecret) || isWeak(refreshSecret)) {
    throw new Error(
      'JWT_SECRET et JWT_REFRESH_SECRET doivent être des secrets forts (≥ 32 caractères aléatoires) en production. ' +
        'Générez-les avec : openssl rand -hex 64',
    );
  }
}
