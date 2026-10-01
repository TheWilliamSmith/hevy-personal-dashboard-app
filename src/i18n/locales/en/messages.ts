export const errors = {
  generic: 'Something went wrong.',
  network: 'Could not reach the server. Check your connection.',
  notFound: 'Not found.',
  conflict: 'This action is no longer possible.',
  tooManyAttempts: 'Too many attempts. Wait a moment and try again.',
  serverFailed: 'The server failed to answer. Try again in a moment.',
  requestFailed: 'Request failed (HTTP {status}).',
  loadGoals: 'Could not load your goals.',
  loadProfile: 'Could not load your profile.',
  mute: 'Could not mute.',
  unmute: 'Could not unmute.',
  hevyRejected: 'Hevy rejected this key. Check it and try again.',
  hevyNotPro: 'This account is not on Hevy Pro. The Hevy API requires a Pro subscription.',
  hevyKeyFormat: 'That key is not in the expected format.',
  fileTooLarge: 'This file exceeds the 10 MB limit.',
  importServer: 'The server could not process this import. Try again in a moment.',
  fileRejected: 'The server rejected this file.',
  unexpectedResponse: 'Unexpected response from the server (HTTP {status}).',
  csvOnly: 'Only .csv files are accepted. Export your workouts from Hevy as CSV.',
  fileEmpty: 'This file is empty.',
  malformed: 'The server returned a malformed response.',
  uploadTimeout: 'The upload timed out. Try again.',
  syncNotFound: 'A sync is already running, but it could not be found. Try again in a moment.',
  oauthUnavailable: '{provider} sign-in is not available yet. Use your email and password.',
};

export const validation = {
  email: 'Enter a valid email address.',
  passwordLength: 'Use at least {min} characters.',
  passwordVariety: 'Mix upper and lower case letters, digits or symbols.',
};

export const goalText = {
  exercise: 'Exercise',
  oneRepMax: '{exercise} · estimated 1RM',
  workingWeight: '{exercise} · working weight',
  weeklyWorkouts: 'Workouts per week',
  totalVolume: 'Total volume',
  weeksMet: '{met} of the last {count} weeks met.',
  firstWeek: 'First week.',
  thisWeek: 'This week · {history}',
  reachedOn: 'Reached on {date}.',
  reached: 'Reached.',
  deadline: ' Deadline {date}.',
  needsSessions: 'Needs a few more sessions to project.{deadline}',
  expected: 'Expected around {date}.{deadline}',
  notReaching: 'The current trend does not reach it.{deadline}',
};

export const progressText = {
  reps: '{count} reps',
  perWeek: '{value} %/week',
  atBest: 'at best',
  vsBest: '{value} % vs best',
  today: 'today',
  yesterday: 'yesterday',
  daysAgo: '{count} days ago',
  thisWeek: 'this week',
  weeksAgo: '{count} week ago | {count} weeks ago',
};

export const setTypes = {
  NORMAL: 'Normal',
  WARMUP: 'Warm-up',
  FAILURE: 'Failure',
  DROP: 'Drop',
};

export const achievementText = {
  hiddenLocked: 'Hidden achievement, locked',
  warningTriggered: 'warning, triggered',
  warningNotTriggered: 'warning, not triggered',
  unlocked: 'unlocked, {rarity}',
  locked: 'locked',
  tier: 'tier {tier}',
  on: 'on {date}',
  progress: 'progress {progress}, {percent} percent',
  weeks: 'weeks',
};
