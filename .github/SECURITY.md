# Politique de sécurité

## Versions prises en charge

| Version | Support |
|---------|---------|
| `main` (dernière) | Correctifs de sécurité acceptés |
| Branches / tags plus anciens | Non maintenus sauf accord explicite |

## Signaler une vulnérabilité

**Ne pas** ouvrir d’issue publique pour une faille de sécurité (auth, isolation des données, XSS, injection, fuite de tokens, etc.).

1. Utilisez **[GitHub Security Advisories](https://github.com/esteban-m/open-task/security/advisories/new)** (*Report a vulnerability*) pour un signalement **privé**.
2. Si vous n’avez pas accès à cette fonctionnalité, ouvrez une issue en indiquant uniquement qu’il s’agit d’un problème de sécurité **sans détails exploitables** ; le mainteneur vous contactera pour un canal privé.

### Informations utiles à inclure

- Description du problème et impact (confidentialité, intégrité, disponibilité).
- Étapes pour reproduire ou preuve de concept minimale.
- Composant concerné (`backend`, `frontend`, WebSocket, Docker, etc.).
- Version / commit (`main` + hash si possible).
- Environnement (local, Docker, production).

### Ce que nous ne demandons pas

- Pas de tests destructifs sur des systèmes que vous ne contrôlez pas.
- Pas de scan agressif ou d’énumération massive sur une instance hébergée sans autorisation.

## Délais de réponse (objectifs)

| Étape | Délai indicatif |
|-------|-----------------|
| Accusé de réception | 3 jours ouvrés |
| Évaluation initiale | 7 jours ouvrés |
| Correctif ou statut (accepté / refusé / hors périmètre) | selon gravité, en général sous 30 jours |

Ces délais sont indicatifs pour un projet maintenu à titre personnel / pédagogique.

## Périmètre

Inclus (exemples) :

- contournement d’authentification ou d’autorisation (accès aux listes/tâches d’un autre utilisateur) ;
- vol ou fixation de session (JWT, refresh cookie) ;
- XSS stocké ou réfléchi (markdown, rendu HTML) ;
- injections (SQL via Prisma mal utilisé, commandes, SSRF) ;
- secrets par défaut en production, exposition Swagger ou endpoints sensibles ;
- déni de service critique sur l’API ou les WebSockets.

Hors périmètre (exemples) :

- problèmes purement cosmétiques sans impact sécurité ;
- absence de rate limiting sur des routes non sensibles ;
- configuration TLS / reverse-proxy de votre hébergement (sauf si documentée comme supportée par le projet) ;
- versions obsolètes de dépendances **déjà** couvertes par un advisory Dependabot public.

## Divulgation coordonnée

Nous préférons une divulgation responsable : nous corrigeons d’abord, publions un advisory si pertinent, puis créditons le rapporteur (avec votre accord).

## Mesures en place

Voir la section [Sécurité](https://github.com/esteban-m/open-task#-sécurité) du README (JWT dual-token, isolation listes, sanitization markdown, CI CodeQL, Dependabot).
