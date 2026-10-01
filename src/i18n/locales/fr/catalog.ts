import type { Messages } from '../../types';
import type * as en from '../en/catalog';

export const muscles: Messages<typeof en.muscles> = {
  CHEST: 'Pectoraux',
  BACK: 'Dos',
  TRAPS: 'Trapèzes',
  SHOULDERS: 'Épaules',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Avant-bras',
  QUADS: 'Quadriceps',
  HAMSTRINGS: 'Ischio-jambiers',
  GLUTES: 'Fessiers',
  ADDUCTORS: 'Adducteurs',
  CALVES: 'Mollets',
  ABS: 'Abdos',
  CARDIO: 'Cardio',
  FULL_BODY: 'Corps entier',
};

export const equipment: Messages<typeof en.equipment> = {
  BARBELL: 'Barre',
  DUMBBELL: 'Haltère',
  MACHINE: 'Machine',
  CABLE: 'Poulie',
  BODYWEIGHT: 'Poids du corps',
  ASSISTED: 'Assisté',
  OTHER: 'Autre',
};

export const kinds: Messages<typeof en.kinds> = {
  STRENGTH: 'Force',
  CARDIO: 'Cardio',
  BODYWEIGHT_HOLD: 'Gainage',
};

export const statuses: Messages<typeof en.statuses> = {
  REGRESSING: 'En baisse',
  PLATEAU: 'Plateau',
  STALE: 'Délaissé',
  PROGRESSING: 'En progrès',
  NOT_ENOUGH_DATA: 'Pas assez de séances',
};

export const statusEmpty: Messages<typeof en.statusEmpty> = {
  REGRESSING: 'Rien en baisse, parfait.',
  PLATEAU: 'Aucun plateau sur cette période.',
  STALE: 'Rien de délaissé, tout tourne encore.',
  PROGRESSING: 'Rien ne dépasse encore le seuil.',
  NOT_ENOUGH_DATA: 'Chaque exercice a assez de séances pour être évalué.',
};

export const windows: Messages<typeof en.windows> = {
  '8w': '8 semaines',
  '12w': '12 semaines',
  '26w': '26 semaines',
  '52w': '52 semaines',
  short8w: '8 sem',
  short12w: '12 sem',
  short26w: '26 sem',
  short52w: '52 sem',
};

export const metricsUsed: Messages<typeof en.metricsUsed> = {
  est1RM: '1RM estimé',
  totalReps: 'répétitions totales',
  distancePerMinute: 'distance par minute',
  longestHoldSeconds: 'plus long maintien',
};

export const goalStatuses: Messages<typeof en.goalStatuses> = {
  ACHIEVED: 'Atteint',
  ON_TRACK: 'En bonne voie',
  OFF_TRACK: 'En retard',
  NOT_ENOUGH_DATA: 'Pas assez de séances',
};

export const goalTypes: Messages<typeof en.goalTypes> = {
  EXERCISE_1RM: '1RM estimé',
  EXERCISE_WEIGHT: 'Charge de travail',
  WEEKLY_WORKOUTS: 'Séances par semaine',
  PERIOD_VOLUME: 'Volume total',
};

export const goalTypesShort: Messages<typeof en.goalTypesShort> = {
  EXERCISE_1RM: '1RM',
  EXERCISE_WEIGHT: 'Charge',
  WEEKLY_WORKOUTS: 'Hebdo',
  PERIOD_VOLUME: 'Volume',
};

export const goalTypeHints: Messages<typeof en.goalTypeHints> = {
  EXERCISE_1RM: 'Meilleur 1RM estimé sur un exercice, à partir des séries de travail.',
  EXERCISE_WEIGHT: 'Série de travail la plus lourde sur un exercice, échauffements exclus.',
  WEEKLY_WORKOUTS: 'Nombre de séances du lundi au dimanche.',
  PERIOD_VOLUME: 'Charge × répétitions cumulées depuis une date de début.',
};

export const rarities: Messages<typeof en.rarities> = {
  COMMON: 'Commun',
  RARE: 'Rare',
  EPIC: 'Épique',
  LEGENDARY: 'Légendaire',
};

export const families: Messages<typeof en.families> = {
  VOLUME: 'Volume',
  STRENGTH: 'Force',
  CONSISTENCY: 'Régularité',
  ENDURANCE: 'Endurance',
  CARDIO: 'Cardio',
  VARIETY: 'Variété',
  MILESTONE: 'Étape',
  ODDITY: 'Insolite',
};

export const ladders: Messages<typeof en.ladders> = {
  WORKOUT: 'Séances enregistrées',
  VOLUME: 'Volume total',
  BENCH: 'Développé couché',
  SQUAT: 'Squat',
  DEADLIFT: 'Soulevé de terre',
  TIME: 'Temps sous la barre',
  STREAK: 'Série hebdomadaire',
  CARDIO: 'Distance cardio',
  EXPLORER: 'Exercices essayés',
};

export const metrics: Messages<typeof en.metrics> = {
  volume: 'Volume',
  sets: 'Séries',
  reps: 'Répétitions',
  duration: 'Durée',
  workouts: 'Séances',
};

export const units: Messages<typeof en.units> = {
  sets: '{count} série | {count} séries',
  reps: '{count} rép. | {count} rép.',
  workouts: '{count} séance | {count} séances',
};
