# Tickets (Linear)

Le travail à faire vit dans Linear, pas dans le code ni dans des fichiers TODO. Ce document est identique dans `hevy-personal-dashboard-app` et `hevy-personal-dashboard-api`.

## Où

- **Équipe Linear** : `HevyPersonalDashboard`, identifiants `HEV-<n>`.
- **Projet Linear** : `Hevy Personal Dashboard`, un seul projet pour le front et l'API. Tout ticket y est rattaché.
- **Labels de repo** : `app` (front), `api` (back). Un ticket qui touche les deux porte les deux labels et reste un seul ticket.
- **Labels de type** : `Feature` (nouvelle capacité), `Bug` (comportement faux), `Improvement` (dette technique, outillage, amélioration d'un existant), `Security`.
- **Priorité** : Urgent, High, Medium, Low. Un ticket sans priorité n'est pas prêt.
- **Dépendances** : une dépendance entre tickets se déclare avec la relation "blocked by", pas seulement dans le texte.

## Écrire un ticket

Titre à l'impératif, en anglais, court : `Add weekly recap email`, `Refuse API calls after token expiry`.

Description en français, avec ces sections :

```markdown
## Contexte
Pourquoi ce ticket existe, ce qui se passe aujourd'hui.

## Objectif
Ce qui doit être vrai une fois terminé, du point de vue de l'utilisateur.

## Critères d'acceptation
- [ ] Vérifiable, un point par ligne
- [ ] Tests ajoutés (unit et/ou e2e)

## Notes techniques
API : routes, tables, migrations. App : vues, composants, composables.
```

## Statuts

| Statut | Sens |
| --- | --- |
| Backlog | Idée validée, pas encore planifiée |
| Todo | Prochain travail, prêt à être pris |
| In Progress | En cours, puis en attente de validation une fois le travail rendu |
| Done | Validé et commité par l'utilisateur |
| Canceled / Duplicate | Abandonné / doublon d'un autre ticket (relié) |

## Travailler sur un ticket

1. Lire le ticket en entier, commentaires compris. S'il manque une information pour décider, poser la question en commentaire du ticket plutôt que deviner.
2. Passer le ticket en **In Progress** au début du travail.
3. Rester dans le périmètre du ticket. Un problème découvert en route devient un **nouveau ticket** (labels et priorité renseignés), pas un changement glissé dans le même travail.
4. Avant de rendre la main : typecheck et tests des repos touchés passent (voir `AGENTS.md` de chaque repo), critères d'acceptation cochés dans le ticket.
5. Laisser le ticket en **In Progress** et ajouter un commentaire qui commence par **Ready for review** :
   - ce qui a changé, en quelques lignes, par repo ;
   - comment le vérifier ;
   - le ou les messages de commit proposés.
6. Ne jamais passer un ticket en **Done** : c'est l'utilisateur qui valide et commite.

## Commits

Conventional Commits en anglais. L'identifiant du ticket va en pied de message pour que Linear relie le commit :

```
feat(auth): refuse API calls after token expiry

- ...

Refs HEV-12
```
