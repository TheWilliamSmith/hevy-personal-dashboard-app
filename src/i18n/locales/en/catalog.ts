export const muscles = {
  CHEST: 'Chest',
  BACK: 'Back',
  TRAPS: 'Traps',
  SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Forearms',
  QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  GLUTES: 'Glutes',
  ADDUCTORS: 'Adductors',
  CALVES: 'Calves',
  ABS: 'Abs',
  CARDIO: 'Cardio',
  FULL_BODY: 'Full body',
};

export const equipment = {
  BARBELL: 'Barbell',
  DUMBBELL: 'Dumbbell',
  MACHINE: 'Machine',
  CABLE: 'Cable',
  BODYWEIGHT: 'Bodyweight',
  ASSISTED: 'Assisted',
  OTHER: 'Other',
};

export const kinds = {
  STRENGTH: 'Strength',
  CARDIO: 'Cardio',
  BODYWEIGHT_HOLD: 'Hold',
};

export const statuses = {
  REGRESSING: 'Regressing',
  PLATEAU: 'Plateau',
  STALE: 'Stale',
  PROGRESSING: 'Progressing',
  NOT_ENOUGH_DATA: 'Needs more sessions',
};

export const statusEmpty = {
  REGRESSING: 'Nothing regressing — good.',
  PLATEAU: 'No plateaus in this window.',
  STALE: 'Nothing stale — everything is still in rotation.',
  PROGRESSING: 'Nothing is climbing past the threshold yet.',
  NOT_ENOUGH_DATA: 'Every exercise has enough sessions to assess.',
};

export const windows = {
  '8w': '8 weeks',
  '12w': '12 weeks',
  '26w': '26 weeks',
  '52w': '52 weeks',
  short8w: '8W',
  short12w: '12W',
  short26w: '26W',
  short52w: '52W',
};

export const metricsUsed = {
  est1RM: 'est. 1RM',
  totalReps: 'total reps',
  distancePerMinute: 'distance per minute',
  longestHoldSeconds: 'longest hold',
};

export const goalStatuses = {
  ACHIEVED: 'Achieved',
  ON_TRACK: 'On track',
  OFF_TRACK: 'Off track',
  NOT_ENOUGH_DATA: 'Needs more sessions',
};

export const goalTypes = {
  EXERCISE_1RM: 'Estimated 1RM',
  EXERCISE_WEIGHT: 'Working weight',
  WEEKLY_WORKOUTS: 'Workouts per week',
  PERIOD_VOLUME: 'Total volume',
};

export const goalTypesShort = {
  EXERCISE_1RM: '1RM',
  EXERCISE_WEIGHT: 'Weight',
  WEEKLY_WORKOUTS: 'Weekly',
  PERIOD_VOLUME: 'Volume',
};

export const goalTypeHints = {
  EXERCISE_1RM: 'Best estimated one-rep max on an exercise, from working sets.',
  EXERCISE_WEIGHT: 'Heaviest working set on an exercise, warm-ups excluded.',
  WEEKLY_WORKOUTS: 'Number of workouts from Monday to Sunday.',
  PERIOD_VOLUME: 'Weight × reps added up from a start date.',
};

export const rarities = {
  COMMON: 'Common',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary',
};

export const families = {
  VOLUME: 'Volume',
  STRENGTH: 'Strength',
  CONSISTENCY: 'Consistency',
  ENDURANCE: 'Endurance',
  CARDIO: 'Cardio',
  VARIETY: 'Variety',
  MILESTONE: 'Milestone',
  ODDITY: 'Oddity',
};

export const ladders = {
  WORKOUT: 'Workouts logged',
  VOLUME: 'Total volume',
  BENCH: 'Bench press',
  SQUAT: 'Squat',
  DEADLIFT: 'Deadlift',
  TIME: 'Time under the bar',
  STREAK: 'Weekly streak',
  CARDIO: 'Cardio distance',
  EXPLORER: 'Exercises tried',
};

export const metrics = {
  volume: 'Volume',
  sets: 'Sets',
  reps: 'Reps',
  duration: 'Duration',
  workouts: 'Workouts',
};

export const units = {
  sets: '{count} set | {count} sets',
  reps: '{count} rep | {count} reps',
  workouts: '{count} workout | {count} workouts',
};
