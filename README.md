# ATS - Applicant Tracking System

Système de suivi des candidatures simple et efficace pour les équipes RH.

## Fonctionnalités

- **Dashboard** : Stats en temps réel, funnel par étape, candidats récents
- **Offres d'emploi** : Créer/archiver des offres (CDI, CDD, Stage, Freelance)
- **Pipeline Kanban** : Glisser-déposer les candidats entre les étapes
- **Gestion des candidats** : Profils complets avec notes, score ★, tags, CV
- **Filtres** : Par étape, offre, note, recherche textuelle

## Étapes du pipeline

`Nouveau` → `Présélection` → `Entretien RH` → `Entretien Technique` → `Offre` → `Embauché` / `Refusé`

## Installation

```bash
# Installer toutes les dépendances
npm run install:all

# Lancer le projet (backend + frontend)
npm run dev
```

- Backend : http://localhost:3001
- Frontend : http://localhost:5173

## Stack technique

- **Backend** : Node.js, Express, SQLite (better-sqlite3)
- **Frontend** : React 18, Vite, Tailwind CSS, React Router v6
