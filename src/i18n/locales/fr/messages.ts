import type { Messages } from '../../types';
import type * as en from '../en/messages';

export const errors: Messages<typeof en.errors> = {
  generic: 'Une erreur est survenue.',
  network: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
  notFound: 'Introuvable.',
  conflict: 'Cette action n’est plus possible.',
  tooManyAttempts: 'Trop de tentatives. Patientez un instant puis réessayez.',
  serverFailed: 'Le serveur n’a pas répondu. Réessayez dans un instant.',
  requestFailed: 'La requête a échoué (HTTP {status}).',
  loadGoals: 'Impossible de charger vos objectifs.',
  loadProfile: 'Impossible de charger votre profil.',
  mute: 'Impossible de masquer.',
  unmute: 'Impossible de réafficher.',
  hevyRejected: 'Hevy a refusé cette clé. Vérifiez-la et réessayez.',
  hevyNotPro: 'Ce compte n’est pas Hevy Pro. L’API Hevy demande un abonnement Pro.',
  hevyKeyFormat: 'Cette clé n’a pas le format attendu.',
  fileTooLarge: 'Ce fichier dépasse la limite de 10 Mo.',
  importServer: 'Le serveur n’a pas pu traiter cet import. Réessayez dans un instant.',
  fileRejected: 'Le serveur a refusé ce fichier.',
  unexpectedResponse: 'Réponse inattendue du serveur (HTTP {status}).',
  csvOnly: 'Seuls les fichiers .csv sont acceptés. Exportez vos séances depuis Hevy en CSV.',
  fileEmpty: 'Ce fichier est vide.',
  malformed: 'Le serveur a renvoyé une réponse invalide.',
  uploadTimeout: 'L’envoi a expiré. Réessayez.',
  oauthUnavailable:
    'La connexion avec {provider} n’est pas encore disponible. Utilisez votre e-mail et votre mot de passe.',
};

export const validation: Messages<typeof en.validation> = {
  email: 'Saisissez une adresse e-mail valide.',
  passwordLength: 'Utilisez au moins {min} caractères.',
  passwordVariety: 'Mélangez majuscules, minuscules, chiffres ou symboles.',
};

export const goalText: Messages<typeof en.goalText> = {
  exercise: 'Exercice',
  oneRepMax: '{exercise} · 1RM estimé',
  workingWeight: '{exercise} · charge de travail',
  weeklyWorkouts: 'Séances par semaine',
  totalVolume: 'Volume total',
  weeksMet: '{met} des {count} dernières semaines réussies.',
  firstWeek: 'Première semaine.',
  thisWeek: 'Cette semaine · {history}',
  reachedOn: 'Atteint le {date}.',
  reached: 'Atteint.',
  deadline: ' Échéance le {date}.',
  needsSessions: 'Encore quelques séances avant de pouvoir projeter.{deadline}',
  expected: 'Prévu vers le {date}.{deadline}',
  notReaching: 'La tendance actuelle ne l’atteint pas.{deadline}',
};

export const progressText: Messages<typeof en.progressText> = {
  reps: '{count} rép.',
  perWeek: '{value} %/sem.',
  atBest: 'au meilleur',
  vsBest: '{value} % vs meilleur',
  today: 'aujourd’hui',
  yesterday: 'hier',
  daysAgo: 'il y a {count} jours',
  thisWeek: 'cette semaine',
  weeksAgo: 'il y a {count} semaine | il y a {count} semaines',
};

export const setTypes: Messages<typeof en.setTypes> = {
  NORMAL: 'Normale',
  WARMUP: 'Échauffement',
  FAILURE: 'Échec',
  DROP: 'Dégressive',
};

export const achievementText: Messages<typeof en.achievementText> = {
  hiddenLocked: 'Succès caché, verrouillé',
  warningTriggered: 'avertissement, déclenché',
  warningNotTriggered: 'avertissement, non déclenché',
  unlocked: 'débloqué, {rarity}',
  locked: 'verrouillé',
  tier: 'palier {tier}',
  on: 'le {date}',
  progress: 'progression {progress}, {percent} pour cent',
  weeks: 'semaines',
};
