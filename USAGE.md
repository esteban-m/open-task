# Guide d’utilisation — Open-Task

Captures animées générées par Playwright en CI, hébergées sur **GitHub Pages** (pas dans le dépôt Git — pas de push sur `main`, pas de ruleset CodeQL).

**Base URL :** `https://esteban-m.github.io/open-task/demo/`

> Sur une **PR**, la CI exécute smoke + démo Playwright (sans GIF). Sur **push `main`**, la même passe enregistre les GIF et le site Pages est construit dans la CI. En local : `npm run test:e2e:demo` (ffmpeg requis) → `docs/public/demo/`.

---

## 1. Créer un compte

Inscription avec email, mot de passe et confirmations, puis redirection vers l’accueil.

| Desktop | Mobile |
|---------|--------|
| ![Inscription desktop](https://esteban-m.github.io/open-task/demo/desktop/01-inscription.gif) | ![Inscription mobile](https://esteban-m.github.io/open-task/demo/mobile/01-inscription.gif) |

---

## 2. Listes et tâches

Créer une liste depuis la barre latérale, puis ajouter une tâche avec échéance.

| Desktop | Mobile |
|---------|--------|
| ![Liste et tâche desktop](https://esteban-m.github.io/open-task/demo/desktop/02-liste-tache.gif) | ![Liste et tâche mobile](https://esteban-m.github.io/open-task/demo/mobile/02-liste-tache.gif) |

---

## 3. Vues Liste, Kanban et Calendrier

Basculer entre les trois modes d’affichage des tâches (boutons en haut de la zone principale).

| Desktop | Mobile |
|---------|--------|
| ![Vues desktop](https://esteban-m.github.io/open-task/demo/desktop/03-vues-kanban-calendrier.gif) | ![Vues mobile](https://esteban-m.github.io/open-task/demo/mobile/03-vues-kanban-calendrier.gif) |

---

## 4. Connexion

Se déconnecter puis se reconnecter avec le même compte ; les listes restent disponibles.

| Desktop | Mobile |
|---------|--------|
| ![Connexion desktop](https://esteban-m.github.io/open-task/demo/desktop/04-connexion.gif) | ![Connexion mobile](https://esteban-m.github.io/open-task/demo/mobile/04-connexion.gif) |

---

## 5. Navigation mobile

Sur petit écran : menu hamburger → tiroir des listes → création de liste et tâche.

| Mobile |
|--------|
| ![Navigation mobile](https://esteban-m.github.io/open-task/demo/mobile/05-mobile-navigation.gif) |

---

## 6. Thèmes

Changer de palette complète (aperçu dans la barre latérale → panneau de thèmes).

| Desktop | Mobile |
|---------|--------|
| ![Thèmes desktop](https://esteban-m.github.io/open-task/demo/desktop/06-themes.gif) | ![Thèmes mobile](https://esteban-m.github.io/open-task/demo/mobile/06-themes.gif) |

---

## 7. Kanban — glisser-déposer

Deux listes, une tâche déplacée d’une colonne à l’autre en vue Kanban.

| Desktop | Mobile |
|---------|--------|
| ![Kanban drag desktop](https://esteban-m.github.io/open-task/demo/desktop/07-kanban-drag.gif) | ![Kanban drag mobile](https://esteban-m.github.io/open-task/demo/mobile/07-kanban-drag.gif) |

---

## 8. Calendrier — échelles

Vue calendrier : mois, semaine, jour et retour à « Aujourd’hui ».

| Desktop | Mobile |
|---------|--------|
| ![Calendrier desktop](https://esteban-m.github.io/open-task/demo/desktop/08-calendrier-echelles.gif) | ![Calendrier mobile](https://esteban-m.github.io/open-task/demo/mobile/08-calendrier-echelles.gif) |

---

## 9. Partage de liste

Un propriétaire invite un collègue par email ; le collaborateur voit la liste marquée « partagée ».

| Desktop | Mobile |
|---------|--------|
| ![Partage desktop](https://esteban-m.github.io/open-task/demo/desktop/09-partage-liste.gif) | ![Partage mobile](https://esteban-m.github.io/open-task/demo/mobile/09-partage-liste.gif) |

---

## Aller plus loin

- [Documentation technique](https://esteban-m.github.io/open-task/docs/) (GitHub Pages)
- [Composants UI (Histoire)](https://esteban-m.github.io/open-task/histoire/)
- [Swagger API](https://esteban-m.github.io/open-task/swagger/)
- [README du dépôt](https://github.com/esteban-m/open-task/blob/main/README.md) — installation Docker, API, WebSocket temps réel
- Rôles viewer / editor / admin : doc **Backend** et **Fonctionnalités** du README
