# Variables d'environnement

Référence alignée sur [`.env.example`](https://github.com/esteban-m/open-task/blob/main/.env.example).

## PostgreSQL

| Variable | Description | Exemple |
|----------|-------------|---------|
| `POSTGRES_USER` | Utilisateur BDD | `opentask` |
| `POSTGRES_PASSWORD` | Mot de passe | _(secret)_ |
| `POSTGRES_DB` | Nom de la base | `opentask` |

`DATABASE_URL` est construite automatiquement dans Docker Compose pour le backend.

## JWT & cookies

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Signature access token (≥ 32 car. en prod) |
| `JWT_REFRESH_SECRET` | Signature refresh token |
| `COOKIE_SECURE` | `true` en HTTPS production ; `false` en local HTTP |

## URLs

| Variable | Usage |
|----------|--------|
| `FRONTEND_URL` | CORS + origine autorisée |
| `API_BASE_URL` | Client frontend (build) |
| `WS_BASE_URL` | Connexion Socket.io |

## Production

| Variable | Description |
|----------|-------------|
| `ENABLE_SWAGGER` | `true` pour exposer `/api` (déconseillé en prod publique) |
| `SKIP_PRODUCTION_SECRET_CHECK` | `true` uniquement en dev Docker local |

## Voir aussi

- [Docker & services](/operations/docker)
- [Authentification](/generated/backend/authentication)
- [Sécurité transverse](/generated/backend/security)
