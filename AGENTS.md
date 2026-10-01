# AGENTS.md

Front Vue 3 du Hevy Personal Dashboard. Il consomme l'API `hevy-personal-dashboard-api` (port 8080), à travers le proxy Vite `/api`.

## Design

**Avant toute modification d'interface, lire [docs/design-system.md](docs/design-system.md) et le respecter.** La page Dashboard (`src/views/DashboardView.vue`) est la référence visuelle.

## Tickets

**Le travail à faire vit dans Linear. Avant de commencer ou de rendre un ticket, lire [docs/tickets.md](docs/tickets.md) et le respecter** : statuts, périmètre, commentaire de fin, référence dans le commit. Aucun TODO dans le code.

## Commandes

| Commande | Usage |
| --- | --- |
| `make setup` | Installation après un clone |
| `make dev` | Serveur de développement sur http://localhost:5173 |
| `pnpm typecheck` | Vérification des types (`vue-tsc`) |
| `pnpm test` | Tests Vitest |

Avant de rendre la main : `pnpm typecheck` et `pnpm test` passent.

## Conventions

- **Tests** : tous les tests vivent dans `test/` : `test/unit/` reprend l'arborescence de `src/` (par exemple `test/unit/utils/calendar.spec.ts`), `test/support/` contient les helpers (`router-harness`, `fake-xhr`, `mount`, `fake-api`). Jamais de test dans `src/`. Les specs sont vérifiés par `pnpm typecheck` (`tsconfig.test.json`).
- **Tests de composants** : les `.vue` comptent dans la couverture Sonar (80 % exigés sur le nouveau code). Une nouvelle vue ou un nouveau composant a son test, monté avec `mountWith()` (`test/support/mount.ts` : i18n, routeur en mémoire, `Teleport` et graphiques neutralisés), et des réponses d'API tirées de `test/support/fake-api.ts`. Fichier en `// @vitest-environment jsdom`. Pour un délai de recherche, attendre réellement (`setTimeout`) plutôt qu'utiliser les faux timers de Vitest.
- **Commentaires** : aucun commentaire dans le code (TS, Vue, CSS, config). Seules exceptions : les directives qui changent le comportement (`// @vitest-environment`, `/// <reference>`). Le nom des fonctions et des variables doit suffire.
- **Organisation** : `src/views/` une vue par onglet ; `src/components/<domaine>/` les composants d'une page ; `src/components/ui/` les composants partagés ; logique pure dans `src/utils/`, accès aux données dans `src/composables/`.
- **Textes** : interface en anglais et en français avec vue-i18n. Aucun texte en dur : chaque libellé passe par `t('domaine.clé')` (`src/i18n`), avec la clé dans `src/i18n/locales/en/` et sa traduction dans `src/i18n/locales/fr/` (même fichier, mêmes clés, mêmes `{placeholders}`). Libellés de constantes en getters ou via `translated()`. Dates et nombres via `src/utils/format.ts`, qui suit la langue choisie. `test/unit/i18n/messages.spec.ts` vérifie la parité des deux langues.
- **Commits** : Conventional Commits en anglais, `type(scope): summary`.
