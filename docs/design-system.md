# Design system

Règles UI/UX de l'application. La référence est la page **Dashboard** (`src/views/DashboardView.vue`) : toute page refaite doit lui ressembler. En cas de doute, copier ce que fait le Dashboard plutôt qu'inventer.

## Principes

- **Sombre, calme, dense en information.** Fond quasi noir, texte clair, une seule couleur d'accent (bleu). Aucune décoration gratuite : pas d'ombre, pas de dégradé de fond, pas d'illustration.
- **Pas de cartes.** Le contenu est posé directement sur le fond. Les sections sont séparées par l'espace vertical et, entre deux colonnes, par une fine ligne verticale.
- **Les chiffres d'abord.** Chaque section met en avant une valeur principale en grand, le détail vient ensuite.
- **Une page = un sujet.** Le titre de la page est dans la barre du haut, jamais répété dans le contenu.

## Couleurs

Toujours les classes Tailwind ci-dessous, jamais de couleur en dur dans un template (sauf ECharts et SVG, voir plus bas).

| Rôle | Classe |
| --- | --- |
| Fond de page, sidebar, barre du haut | `bg-zinc-950` |
| Surface discrète (piste de barre, skeleton, survol de ligne) | `bg-zinc-900` |
| Contrôle actif (segment sélectionné) | `bg-zinc-700` |
| Bordures et séparateurs | `border-zinc-800` (`border-zinc-700` pour les carrés d'icône) |
| Texte principal / valeurs | `text-white`, `text-zinc-100` |
| Texte courant | `text-zinc-200` (listes), `text-zinc-400` (paragraphes) |
| Texte secondaire (sous-titres, libellés) | `text-zinc-500` |
| Accent (données, barres, courbes) | `blue-500` / `#3b82f6` |
| Jour d'entraînement (calendrier) | `bg-blue-800` |
| Absence de donnée (calendrier, muscle non travaillé) | `bg-slate-700` |
| Hausse / succès | `text-emerald-400`, pastille `bg-emerald-500` |
| Baisse / erreur | `text-red-400` ; bloc d'erreur `border-red-900/60 bg-red-950/40 text-red-200` |
| Attention | `bg-amber-500` |

**Statuts de progression** (`STATUS_STYLES`, `src/constants/progress.ts`) : Regressing `red-400`, Plateau `amber-400`, Stale `zinc-400`, Progressing `emerald-400`, Needs more sessions `zinc-600`. Un statut s'affiche en pastille + texte de la même couleur, jamais en badge plein.

**Séries multiples** (ex. top 5 des muscles), dans cet ordre : `emerald-500`, `orange-400`, `teal-600`, `zinc-400`, `indigo-400`.

**Échelle d'intensité** (carte du corps, heatmaps) : du plus faible au plus fort `#1e3a8a`, `#1e40af`, `#1d4ed8`, `#2563eb`, `#3b82f6`, `#60a5fa`. Sur fond sombre, plus c'est clair, plus c'est intense. Zéro = `#334155`.

## Typographie

| Élément | Classes |
| --- | --- |
| Titre de page (barre du haut) | `text-base font-semibold text-white` |
| Titre de section | `text-sm font-medium text-zinc-100` |
| Sous-titre de section | `text-xs text-zinc-500` |
| Chiffre héros (une seule fois par page) | `text-5xl font-semibold tracking-tight text-white` |
| Chiffre de section / métrique | `text-2xl font-semibold text-white` |
| Légende sous un chiffre | `text-[11px] leading-tight text-zinc-500` (en-tête) ou `text-xs text-zinc-500` (grille) |
| Texte courant | `text-sm text-zinc-400` |
| Petits libellés (axes, jours, légendes) | `text-[11px] text-zinc-400` ou `text-xs` |

- Tout nombre porte `tabular-nums`.
- Les libellés de l'interface sont en anglais. Les dates et nombres passent par `src/utils/format.ts` (format `fr-FR`).

## Mise en page

- **Cadre** : sidebar à gauche, barre du haut `h-14`, seul `<main>` défile. Ne jamais faire défiler la fenêtre.
- **Page** : conteneur `px-4 pb-10 sm:px-6`, contenu en `flex flex-col gap-10 pt-6`.
- **Rangée à deux colonnes** :

  ```html
  <div class="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-0">
    <section class="lg:pr-8">…</section>
    <section class="border-zinc-800 lg:border-l lg:pl-8">…</section>
  </div>
  ```

  Toujours `minmax(0, …)`, y compris sur mobile : sans ça, un contenu large fait déborder la page. Les proportions (`1.7fr/1fr`, `1fr/1.4fr`…) s'adaptent au contenu.
- **Grille de métriques** : `MetricGrid`, 1 colonne sur mobile, 2 en `sm`, 4 en `xl`, séparateurs verticaux entre colonnes.
- **Section** : `flex flex-col gap-4` (ou `gap-5`), commence toujours par `SectionHeader`.
- **Débordement horizontal** : uniquement à l'intérieur d'un composant (`overflow-x-auto`), jamais au niveau de la page.
- **Arrondis** : `rounded-md` pour les contrôles et boutons, `rounded-lg` pour un bloc encadré (rare), `rounded-full` pour barres et pastilles, `rounded-[3px]` pour les cases de calendrier.

## Composants partagés

À réutiliser avant d'écrire du nouveau code. Tous dans `src/components/ui/`.

| Composant | Usage |
| --- | --- |
| `SectionHeader` | Titre + sous-titre à gauche ; le slot par défaut (à droite) reçoit soit un chiffre de section, soit un contrôle, soit un bouton secondaire. |
| `SectionError` | Erreur de chargement d'une section, avec bouton Retry. Remplace le contenu de la section. |
| `SegmentedControl` | Choix exclusif (métrique, vue…). `shortLabel` optionnel pour mobile. |
| `RangeSwitch` | Choix de période (30 days… All), branché sur `useDashboardFilters`. |
| `MetricGrid` | Grille de chiffres clés avec icône. |

Pour un graphique, `BaseChart` (`src/components/dashboard/BaseChart.vue`) dans un conteneur `relative h-64`.

**Chiffre de section dans l'en-tête** :

```html
<SectionHeader title="Training volume" subtitle="…">
  <p class="text-right">
    <span class="text-2xl font-semibold text-white tabular-nums">48 453 kg</span>
    <span class="block text-[11px] leading-tight text-zinc-500">Total volume</span>
  </p>
</SectionHeader>
```

## Contrôles

- **Contrôles de page** (période, filtres globaux) : dans la barre du haut, via `<Teleport to="#topbar-actions" defer>`.
- **Contrôles de section** : dans le `SectionHeader` ou sur une ligne juste en dessous.
- **Bouton principal** (un seul par écran au maximum) : `rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200`.
- **Bouton secondaire** : `rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-800`.
- **Lien dans un texte** : `font-medium text-zinc-200 underline decoration-zinc-600 underline-offset-2`.
- **Bouton icône** : `rounded-md border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-300 hover:bg-zinc-800`, `aria-label` obligatoire. Une pastille `bg-blue-500` en haut à droite signale un réglage modifié.
- **Lien d'action discret** (Open, Show all) : `rounded-md px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white`.
- **Select** : `rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100` (`text-sm` dans un formulaire).
- **Champ texte** : `rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600`.
- **Case à cocher, slider** : `accent-blue-600`, libellé `text-xs text-zinc-400` avec la valeur en `font-medium text-zinc-100`.
- **Popover** : `rounded-lg border border-zinc-800 bg-zinc-900 p-3 shadow-xl shadow-black/40`, fermé par Échap et par un clic à l'extérieur.
- **Dialogue** : `BaseDialog` avec `tone="dark"` ; en-tête et pied séparés par `border-zinc-800`, action principale en bouton blanc, action destructrice en `bg-red-600 text-white`, avertissement dans un bloc d'erreur (`border-red-900/60 bg-red-950/40 text-red-200`).
- **Filtre multiple** (muscles…) : boutons `rounded-md border px-2 py-1 text-xs` avec pastille de couleur ; sélectionné `border-zinc-600 bg-zinc-800 text-white`, sinon `border-zinc-800 text-zinc-400`.
- **Panneau repliable** (réglages, éléments masqués) : ouvert par un bouton avec `aria-expanded`, chevron `ChevronRight` qui tourne de 90° une fois ouvert.
- **Focus** : tout élément interactif a `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400` (`outline-white` sur un bouton blanc).

## Icônes

- `lucide-vue-next` uniquement, taille `h-4 w-4` (`h-5 w-5` pour le bouton menu mobile), `aria-hidden="true"`.
- Icône de métrique : dans un carré `h-8 w-8 rounded-md border border-zinc-700 text-zinc-300`.

## Données et graphiques

- **Barres horizontales** (répartition, classement) : piste `h-1.5` ou `h-2 rounded-full bg-zinc-900`, remplissage `rounded-full` en accent ou en couleur de série. Valeur et variation alignées à droite en `tabular-nums`.
- **Liste de lignes** (exercices, séances) : lignes séparées par `border-b border-zinc-800`, sans fond ; détail déplié dans un bloc `rounded-md bg-zinc-900`. Nom `text-sm font-medium text-zinc-100`, métadonnées `text-[11px] text-zinc-500` avec pastilles de couleur.
- **Ligne cliquable** (séance d'une liste) : toute la ligne est un `RouterLink` `rounded-md px-2 py-3 hover:bg-zinc-900`, chevron `text-zinc-600` à droite. Les colonnes de chiffres (valeur `text-sm text-zinc-100`, libellé `text-[11px] text-zinc-500`) n'apparaissent qu'à partir de `lg` ; sur mobile, un résumé d'une ligne les remplace.
- **Tableau** : pas de fond d'en-tête ; en-têtes `text-[11px] font-medium text-zinc-500` sur `border-b border-zinc-800`, lignes séparées par `border-zinc-800/60`, chiffres `text-zinc-100 tabular-nums`. Ligne mise en avant (meilleure série) : `bg-emerald-400/10` et libellé `text-emerald-400`.
- **Type de série** : pastille + libellé `text-xs text-zinc-400` (`SET_TYPE_DOT_CLASSES` : normal `zinc-500`, warm-up `amber-400`, failure `red-400`, drop `violet-400`).
- **Filtres d'une liste** : ligne de champs au-dessus de la liste, dans la section (pas dans la barre du haut quand il y en a plus de deux). Champs de date avec `[color-scheme:dark]`. Une barre de filtres collante ne l'est qu'à partir de `lg` (`lg:sticky`), sinon elle mange l'écran mobile.
- **Filtre par catégorie** : les compteurs eux-mêmes sont des boutons (`aria-pressed`), sélection en `bg-zinc-800`, les autres segments de la barre empilée passent à 30 % d'opacité.
- **Variation** : `+18,4 %` en `text-emerald-400`, `-5,1 %` en `text-red-400`, `—` en `text-zinc-600` si pas de comparaison.
- **ECharts** : palette `resolveTheme(true)` avec `splitLine: '#27272a'`, tooltip `#18181b` bordé `#3f3f46`. Pas de ligne d'axe, grille horizontale discrète, courbe `#3b82f6` de 2 px avec aire en dégradé bleu (35 % → 0 %). Pas de légende si une seule série.
- **Survol croisé** : quand deux vues montrent la même donnée (carte du corps et classement), survoler l'une met l'autre en évidence.
- **Info-bulle native** (`title`) pour les petites cases, info-bulle sombre pour les graphiques.

## États

Chaque section gère ses trois états, indépendamment des autres sections :

- **Chargement** : un skeleton de la même forme que le contenu, `animate-pulse bg-zinc-900` (ou `text-zinc-700` sur un chiffre). Seulement tant qu'aucune donnée n'est affichée : un rechargement garde l'ancienne donnée visible.
- **Vide** : phrase courte `text-sm text-zinc-500`, et un lien vers l'onglet Data si l'utilisateur doit agir.
- **Erreur** : `SectionError` avec Retry.

## Responsive

- Mobile d'abord, vérifier à 390 px de large.
- Les deux colonnes passent l'une sous l'autre en dessous de `lg`.
- Les contrôles segmentés utilisent `shortLabel` en dessous de `sm`.
- Un contenu large (calendrier) défile horizontalement dans son propre conteneur et s'ouvre sur la partie la plus récente.

## Accessibilité

- Un vrai élément pour chaque rôle : `button` pour une action, `RouterLink` pour une navigation, `dl/dt/dd` pour des paires libellé/valeur.
- Un graphique ou une grille de données a un `aria-label` qui résume ce qu'il montre (`role="img"` si ce n'est qu'un dessin).
- Groupe de boutons exclusifs : `role="group"` + `aria-label`, chaque bouton avec `aria-pressed`.
- Contraste : jamais de `text-zinc-600` ou plus sombre pour une information utile.

## Migrer une page vers ce design

1. Ajouter l'onglet à `DARK_TABS` dans `src/App.vue`.
2. Supprimer le titre de page du contenu (il est dans la barre du haut).
3. Déplacer les contrôles globaux dans `#topbar-actions`.
4. Remplacer cartes blanches et bordures claires par des sections posées sur le fond, séparées par l'espace et les lignes `border-zinc-800`.
5. Réutiliser les composants de `src/components/ui/`, puis vérifier desktop (1440 px) et mobile (390 px).
