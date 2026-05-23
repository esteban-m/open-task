---
layout: home
title: Open-Task
titleTemplate: Documentation

hero:
  name: Open-Task
  text: Documentation technique
  tagline: Doc-as-code structurée — Guide · Architecture · Backend · Frontend · Référence
  image:
    src: /hero.svg
    alt: Open-Task
  actions:
    - theme: brand
      text: Démarrage rapide
      link: /guide/getting-started
    - theme: alt
      text: Storybook
      link: ../storybook/
    - theme: alt
      text: Swagger
      link: ../swagger/
    - theme: alt
      text: Portail
      link: ../

features:
  - icon: 📘
    title: Guide
    details: Introduction, démarrage Docker, parcours utilisateur — contenu stable versionné dans git.
  - icon: 🏗️
    title: Comprendre
    details: Architecture, schéma Prisma, flux WebSocket — diagrammes Mermaid zoomables.
  - icon: ⚙️
    title: Backend & Frontend
    details: Chapitres par domaine (auth, listes, tâches, Pinia, vues) — pas une liste de fichiers.
  - icon: 📋
    title: Référence
    details: API REST extraite du code, variables d'environnement, exploitation Docker.
---

## Organisation de la documentation

Cette documentation suit le modèle **[Diátaxis](https://diataxis.fr/)** :

| Type | Contenu |
|------|---------|
| **Guide** | Comment démarrer et utiliser le produit |
| **Explication** | Pourquoi l'architecture est ainsi |
| **Backend / Frontend** | Comment chaque couche est implémentée |
| **Référence** | Contrats API, configuration |
| **Exploitation** | Docker, CI, déploiement |

Les chapitres IA sont regénérés par le workflow GitHub Actions à partir du code source réel (`config/open-task.docs.json`).
