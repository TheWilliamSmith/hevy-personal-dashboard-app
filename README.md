# Hevy Personal Dashboard — App

Front-end Vue 3 du Hevy Personal Dashboard : tableau de bord, historique des séances, exercices, progression, carte musculaire et salle des trophées, alimentés par les données Hevy.

Cette application ne fonctionne pas seule. Elle consomme l'API NestJS [`hevy-personal-dashboard-api`](https://github.com/TheWilliamSmith/hevy-personal-dashboard-api).

## Stack

- Vue 3 + Vue Router, TypeScript
- Vite 8, Tailwind CSS 4
- ECharts (`vue-echarts`), icônes `lucide-vue-next`
- Vitest (tests unitaires, couverture v8)

## Développement

### Prérequis

| Outil | Version |
| --- | --- |
| Node.js | 22.x (CI : `22.15.0`) |
| pnpm | 10.x (CI : `10.29.3`) |
| make | fourni avec les Command Line Tools sur macOS |
| API `hevy-personal-dashboard-api` | lancée en local (voir son README) |

Installer pnpm si besoin :

```bash
corepack enable
corepack prepare pnpm@10.29.3 --activate
```

### Démarrage rapide

```bash
git clone git@github.com:TheWilliamSmith/hevy-personal-dashboard-app.git
cd hevy-personal-dashboard-app
make setup   # une seule fois : dépendances exactes du lockfile
make dev     # serveur Vite sur http://localhost:5173
```

L'API doit tourner (`make dev` dans `hevy-personal-dashboard-api`). Si elle ne répond pas sur `http://localhost:8080`, `make dev` affiche un avertissement mais démarre quand même le front. Pour une API sur un autre port : `make dev API_URL=http://localhost:4000`, en plus de surcharger `VITE_API_PROXY_TARGET` (voir plus bas). `make help` liste toutes les commandes.

Les étapes ci-dessous détaillent ce que font ces deux commandes.

### 1. Cloner le dépôt

```bash
git clone git@github.com:TheWilliamSmith/hevy-personal-dashboard-app.git
cd hevy-personal-dashboard-app
```

### 2. Lancer l'API

L'API doit tourner avant de démarrer le front. Suivre les instructions du README de [`hevy-personal-dashboard-api`](https://github.com/TheWilliamSmith/hevy-personal-dashboard-api). Par défaut, elle écoute sur <http://localhost:8080>.

### 3. Installer les dépendances

```bash
pnpm install
```

### 4. Démarrer l'application

```bash
pnpm run dev
```

L'application est disponible sur <http://localhost:5173>.

Le fichier `.env.development` est versionné et suffit en local. Aucune copie n'est nécessaire :

| Variable | Valeur | Rôle |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | préfixe des appels HTTP du front |
| `VITE_API_PROXY_TARGET` | `http://localhost:8080` | cible du proxy Vite |

Le serveur Vite redirige `/api/*` vers l'API et retire le préfixe `/api` (voir `vite.config.ts`). Ainsi, aucune configuration CORS n'est nécessaire. Si l'API tourne sur un autre port, surcharger la cible dans un fichier `.env.development.local` (ignoré par Git) :

```bash
VITE_API_PROXY_TARGET=http://localhost:4000
```

### 5. Charger des données

Au premier lancement, la base est vide. Ouvrir l'onglet **Data** (<http://localhost:5173/?tab=data>) et choisir une source :

- **Connexion Hevy** : coller la clé API Hevy (format UUID). Elle se trouve dans les paramètres développeur de Hevy. Un abonnement **Hevy Pro** est requis.
- **Import CSV** : importer l'export CSV des séances depuis l'application Hevy. Un aperçu s'affiche avant confirmation.

### Scripts disponibles

| Commande | Action |
| --- | --- |
| `pnpm run dev` | serveur de développement Vite avec rechargement à chaud |
| `pnpm run build` | vérification de types (`vue-tsc`) puis build de production dans `dist/` |
| `pnpm run preview` | sert le build de `dist/` localement |
| `pnpm run typecheck` | vérification de types seule |
| `pnpm test` | tests unitaires Vitest (`src/**/*.spec.ts`) |
| `pnpm run test:watch` | tests en mode watch |
| `pnpm run test:coverage` | tests + rapport de couverture dans `coverage/` |

### Dépannage

- **Erreurs réseau ou 502 dans le front** : l'API ne tourne pas, ou `VITE_API_PROXY_TARGET` ne pointe pas vers le bon port.
- **Connexion Hevy refusée** : vérifier la clé API et l'abonnement Hevy Pro. Les erreurs côté serveur sont détaillées dans le README de l'API.

## Structure du projet

```
src/
  charts/        configuration ECharts, thème, courbes de tendance
  components/    composants Vue par domaine (dashboard, workouts, exercises…)
  composables/   logique réactive et accès aux données (useWorkouts, useStats…)
  constants/     muscles, trophées, seuils de progression
  lib/           client HTTP (api.ts) et invalidation du cache
  router/        routes (navigation par onglets via ?tab=)
  types/         types TypeScript alignés sur les DTO de l'API
  utils/         formatage et calculs purs
  views/         vues de premier niveau
docs/            notes sur le contrat de l'API /stats
tools/           script Python de génération de la silhouette SVG
```

## CI

Le workflow `.github/workflows/pipeline.yml` s'exécute à chaque push : installation, tests avec couverture, puis analyse SonarQube et quality gate. Il requiert les secrets `SONAR_TOKEN` et `SONAR_HOST_URL`.
