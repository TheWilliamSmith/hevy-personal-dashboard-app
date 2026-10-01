import type { Messages } from '../../types';
import type * as en from '../en/common';

export const common: Messages<typeof en.common> = {
  appName: 'Hevy Dashboard',
  retry: 'Réessayer',
  cancel: 'Annuler',
  close: 'Fermer',
  save: 'Enregistrer',
  delete: 'Supprimer',
  edit: 'Modifier',
  previous: 'Précédent',
  next: 'Suivant',
  pageOf: 'Page {page} sur {total}',
  dismissNotification: 'Fermer la notification',
  connectOrImport: 'Connecter Hevy ou importer un export CSV',
  somethingWrong: 'Une erreur est survenue. Réessayez.',
  clearFilters: 'Effacer les filtres',
  loading: 'Chargement…',
};

export const nav: Messages<typeof en.nav> = {
  dashboard: 'Tableau de bord',
  body: 'Corps',
  progress: 'Progression',
  goals: 'Objectifs',
  trophies: 'Trophées',
  workouts: 'Séances',
  exercises: 'Exercices',
  settings: 'Paramètres',
  mainNavigation: 'Navigation principale',
  expandSidebar: 'Déplier la barre latérale',
  collapseSidebar: 'Replier la barre latérale',
  closeMenu: 'Fermer le menu',
  openMenu: 'Ouvrir le menu',
  profileAndSettings: 'Profil et paramètres',
};

export const ranges: Messages<typeof en.ranges> = {
  period: 'Période',
  '30d': '30 jours',
  '3m': '3 mois',
  '6m': '6 mois',
  '1y': '1 an',
  all: 'Tout',
  short30d: '30 j',
  short3m: '3 m',
  short6m: '6 m',
  short1y: '1 an',
  shortAll: 'Tout',
  day: 'Jour',
  week: 'Semaine',
  month: 'Mois',
  last: 'Sur {range}',
  allTime: 'Depuis le début',
};

export const format: Messages<typeof en.format> = {
  justNow: "à l'instant",
  minutesAgo: 'il y a {count} minute | il y a {count} minutes',
  hoursAgo: 'il y a {count} heure | il y a {count} heures',
  daysAgo: 'il y a {count} jour | il y a {count} jours',
  signedPercent: '{sign}{value} %',
};

export const sync: Messages<typeof en.sync> = {
  hevy: 'Hevy',
  connectHevy: 'Connecter Hevy',
  hevyConnected: 'Hevy connecté',
  checking: 'Vérification de la connexion…',
  pitch: 'Synchronisez vos séances automatiquement avec votre clé API Hevy Pro.',
  inProgress: 'Synchronisation en cours…',
  needsAttention: 'La dernière synchronisation demande votre attention.',
  syncedAgo: 'Synchronisé {when}.',
  neverSynced: 'Jamais synchronisé.',
  syncing: 'Synchronisation…',
  syncNow: 'Synchroniser',
  connect: 'Connecter',
};
