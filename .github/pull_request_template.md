## Résumé

<!-- Quoi et pourquoi (1–3 phrases). -->

Fixes #<!-- numéro d’issue, ou supprimez cette ligne -->

## Type de changement

- [ ] Correction de bug
- [ ] Nouvelle fonctionnalité
- [ ] Refactoring (sans changement de comportement)
- [ ] Documentation
- [ ] CI / outillage
- [ ] Sécurité (si oui : signalement privé déjà fait via Security Advisories)

## Changements principaux

<!-- Liste courte : fichiers / modules touchés, comportement API ou WS si pertinent. -->

-

## Comment tester

<!-- Étapes pour valider manuellement. -->

1.
2.

## Checklist

- [ ] Branche créée depuis `main` (pas de commit direct sur `main`)
- [ ] Le code suit les conventions du [CONTRIBUTING.md](../CONTRIBUTING.md)
- [ ] `cd backend && npm run lint` — OK
- [ ] `cd backend && npm test` — OK
- [ ] e2e backend exécutés si le diff touche l’API, l’auth, Prisma ou l’isolation (`npm run test:e2e`)
- [ ] `cd frontend && npm run lint` — OK (si frontend modifié)
- [ ] Aucun secret, token ou `.env` réel dans le diff
- [ ] Migrations Prisma ajoutées / documentées si le schéma a changé
- [ ] README ou `.env.example` mis à jour si le setup ou la config change

## Captures / logs (optionnel)

<!-- Screenshots, extrait de réponse API (sans JWT). -->
