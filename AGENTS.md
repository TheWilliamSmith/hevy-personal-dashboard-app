# AGENTS.md

Front Vue 3 du Hevy Personal Dashboard. Il consomme l'API `hevy-personal-dashboard-api` (port 8080), à travers le proxy Vite `/api`.

## Design

**Avant toute modification d'interface, lire [docs/design-system.md](docs/design-system.md) et le respecter.** La page Dashboard (`src/views/DashboardView.vue`) est la référence visuelle. Les pages sont refaites une à une ; une page refaite est listée dans `DARK_TABS` (`src/App.vue`).

## Commandes

| Commande | Usage |
| --- | --- |
| `make setup` | Installation après un clone |
| `make dev` | Serveur de développement sur http://localhost:5173 |
| `pnpm typecheck` | Vérification des types (`vue-tsc`) |
| `pnpm test` | Tests Vitest |

Avant de rendre la main : `pnpm typecheck` et `pnpm test` passent.

## Conventions

- **Tests** : tout nouveau fichier de test va dans `test/` (par exemple `test/unit/utils/calendar.spec.ts`), jamais dans `src/`.
- **Commentaires** : aucun commentaire qui répète le code. Un commentaire n'existe que s'il apporte une information introuvable ailleurs.
- **Organisation** : `src/views/` une vue par onglet ; `src/components/<domaine>/` les composants d'une page ; `src/components/ui/` les composants partagés ; logique pure dans `src/utils/`, accès aux données dans `src/composables/`.
- **Textes** : interface en anglais ; dates et nombres formatés via `src/utils/format.ts`.
- **Commits** : Conventional Commits en anglais, `type(scope): summary`.
