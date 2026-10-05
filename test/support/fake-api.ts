import type { AchievementCatalog, AchievementItem, AchievementsSummary } from '@/types/achievements';
import type { ExerciseCard, ExerciseCatalog, ExerciseDetail } from '@/types/exercises';
import type { FriendsOverview, LeaderboardEntry, UserCard, UserPage } from '@/types/friends';
import type { Goal } from '@/types/goals';
import type { HevyConnectionState, HevySyncRun } from '@/types/hevy';
import type { ImportBatchSummary } from '@/types/imports';
import type { ProfileResponse } from '@/types/profile';
import type { ProgressAlertsResponse, ProgressItem } from '@/types/progress';
import type { CalendarDay, MuscleGroupValues, MuscleHeatmap, Overview, TimeseriesPoint, TrainingBalance } from '@/types/stats';
import type { Paginated, WorkoutDetail, WorkoutSummary } from '@/types/workouts';

const MUSCLES = [
  'CHEST',
  'BACK',
  'TRAPS',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'FOREARMS',
  'QUADS',
  'HAMSTRINGS',
  'GLUTES',
  'ADDUCTORS',
  'CALVES',
  'ABS',
  'CARDIO',
  'FULL_BODY',
] as const;

function muscles(values: Partial<MuscleGroupValues>): MuscleGroupValues {
  return Object.fromEntries(MUSCLES.map((muscle) => [muscle, values[muscle] ?? 0])) as MuscleGroupValues;
}

export const overview: Overview = {
  totalWorkouts: 12,
  totalVolumeKg: 48250.5,
  totalSets: 240,
  totalReps: 1820,
  totalDurationSec: 43200,
  avgDurationSec: 3600,
  avgVolumePerWorkout: 4020,
  avgSetsPerWorkout: 20,
  firstWorkoutAt: '2026-07-01T18:00:00.000Z',
  lastWorkoutAt: '2026-09-28T18:00:00.000Z',
  distinctExercises: 9,
  currentStreakWeeks: 4,
  longestStreakWeeks: 6,
  workoutsPerWeekAvg: 3.2,
  previous: { totalWorkouts: 10, totalVolumeKg: 41000, totalSets: 210, avgDurationSec: 3400 },
};

export const timeseries: TimeseriesPoint[] = [
  { bucket: '2026-09-07', value: 3200, workoutCount: 1 },
  { bucket: '2026-09-14', value: 4100, workoutCount: 2 },
  { bucket: '2026-09-21', value: 0, workoutCount: 0 },
  { bucket: '2026-09-28', value: 5200, workoutCount: 2 },
];

export const calendar: CalendarDay[] = [
  { date: '2026-09-28', workouts: 1, volumeKg: 5200, durationSec: 3600 },
  { date: '2026-09-21', workouts: 0, volumeKg: 0, durationSec: 0 },
  { date: '2026-09-14', workouts: 2, volumeKg: 4100, durationSec: 7000 },
];

export const heatmap: MuscleHeatmap = {
  metric: 'sets',
  from: '2026-09-01T00:00:00.000Z',
  to: '2026-09-30T23:59:59.999Z',
  values: muscles({ CHEST: 12, BACK: 9, QUADS: 15, BICEPS: 4, CARDIO: 2 }),
  max: 15,
  topMuscle: 'QUADS',
  leastTrained: ['CALVES', 'FOREARMS', 'ABS'],
  weeklyAverage: muscles({ CHEST: 3, BACK: 2.2, QUADS: 3.8, BICEPS: 1, CARDIO: 0.5 }),
  previous: muscles({ CHEST: 8, BACK: 10, QUADS: 12, CALVES: 3 }),
};

export function trainingBalance(overrides: Partial<TrainingBalance> = {}): TrainingBalance {
  return {
    from: '2026-09-01T00:00:00.000Z',
    to: '2026-09-30T23:59:59.999Z',
    split: {
      push: 40,
      pull: 20,
      legs: 10,
      core: 6,
      totalSets: 76,
      pushPullRatio: 2,
      pushPullVerdict: 'PUSH_HEAVY',
      lowerShare: 0.143,
      upperLowerVerdict: 'UPPER_HEAVY',
    },
    neglected: {
      weeks: 3,
      muscles: [
        { muscleGroup: 'ADDUCTORS', lastTrainedAt: null, weeksSince: null },
        { muscleGroup: 'CALVES', lastTrainedAt: '2026-08-01T10:00:00.000Z', weeksSince: 9 },
      ],
    },
    consistency: {
      minWorkouts: 2,
      weeksMet: 2,
      weeks: Array.from({ length: 12 }, (_, index) => ({
        weekStart: new Date(Date.UTC(2026, 6, 13 + index * 7)).toISOString().slice(0, 10),
        workouts: [0, 1, 0, 2, 0, 0, 1, 0, 3, 0, 1, 0][index] ?? 0,
      })),
    },
    ...overrides,
  };
}

export function achievement(overrides: Partial<AchievementItem> = {}): AchievementItem {
  return {
    code: 'WORKOUT_10',
    family: 'MILESTONE',
    tier: 2,
    name: 'Ten Down',
    description: 'Log 10 workouts.',
    flavor: 'Momentum.',
    icon: 'dumbbell',
    rarity: 'RARE',
    xp: 100,
    secret: false,
    unlocked: true,
    unlockedAt: '2026-09-20T10:00:00.000Z',
    workoutId: 'w1',
    progress: null,
    ...overrides,
  };
}

export const achievementsSummary: AchievementsSummary = {
  level: { level: 3, totalXp: 640, into: 140, needed: 300 },
  unlockedCount: 5,
  totalCount: 40,
  recentUnlocks: [{ code: 'WORKOUT_10', name: 'Ten Down', icon: 'dumbbell', rarity: 'RARE', xp: 100, unlockedAt: '2026-09-20T10:00:00.000Z' }],
};

export const achievementCatalog: AchievementCatalog = {
  level: achievementsSummary.level,
  unlockedCount: 3,
  totalCount: 6,
  groups: [
    {
      family: 'MILESTONE',
      total: 3,
      unlocked: 2,
      achievements: [
        achievement({ code: 'WORKOUT_1', tier: 1, name: 'First Step', rarity: 'COMMON' }),
        achievement(),
        achievement({ code: 'WORKOUT_50', tier: 3, name: 'Fifty', unlocked: false, unlockedAt: null, workoutId: null, progress: { value: 12, target: 50 } }),
      ],
    },
    {
      family: 'ODDITY',
      total: 3,
      unlocked: 1,
      achievements: [
        achievement({ code: 'NIGHT_OWL', family: 'ODDITY', tier: null, name: 'Night Owl', rarity: 'EPIC' }),
        achievement({ code: 'SECRET_1', family: 'ODDITY', tier: null, name: '???', secret: true, unlocked: false, unlockedAt: null }),
        achievement({ code: 'SKIP_LEGS', family: 'ODDITY', tier: null, name: 'Leg Day Denier', xp: 0, unlocked: false, unlockedAt: null, progress: { value: 2, target: 4 } }),
      ],
    },
  ],
};

export function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g1',
    type: 'EXERCISE_1RM',
    target: 120,
    unit: 'kg',
    exercise: { id: 'e1', name: 'Bench Press (Barbell)', slug: 'bench-press-barbell' },
    startsAt: '2026-09-01T00:00:00.000Z',
    deadline: '2026-12-31T00:00:00.000Z',
    achievedAt: null,
    archivedAt: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    progress: { current: 100, percent: 83.3, status: 'ON_TRACK', projectedDate: '2026-11-20T00:00:00.000Z' },
    ...overrides,
  };
}

export const goals: Goal[] = [
  goal(),
  goal({
    id: 'g2',
    type: 'WEEKLY_WORKOUTS',
    target: 3,
    unit: 'workouts',
    exercise: null,
    deadline: null,
    progress: { current: 1, percent: 33, status: 'OFF_TRACK', projectedDate: null, weeksMet: 2, weeksConsidered: 4 },
  }),
  goal({ id: 'g3', archivedAt: '2026-09-25T00:00:00.000Z', progress: { current: 120, percent: 100, status: 'ACHIEVED', projectedDate: null } }),
];

export function workoutSummary(overrides: Partial<WorkoutSummary> = {}): WorkoutSummary {
  return {
    id: 'w1',
    title: 'Push Day',
    startedAt: '2026-09-28T18:00:00.000Z',
    endedAt: '2026-09-28T19:05:00.000Z',
    durationSec: 3900,
    exerciseCount: 3,
    setCount: 12,
    totalVolumeKg: 5200,
    exerciseNames: ['Bench Press (Barbell)', 'Dip', '+1'],
    ...overrides,
  };
}

export const workoutsPage: Paginated<WorkoutSummary> = {
  data: [
    workoutSummary(),
    workoutSummary({ id: 'w0', startedAt: '2026-09-21T18:00:00.000Z', totalVolumeKg: 4800 }),
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

export function workoutDetail(overrides: Partial<WorkoutDetail> = {}): WorkoutDetail {
  return {
    id: 'w1',
    title: 'Push Day',
    description: 'Felt strong.',
    startedAt: '2026-09-28T18:00:00.000Z',
    endedAt: '2026-09-28T19:05:00.000Z',
    durationSec: 3900,
    totalVolumeKg: 5200,
    totalSets: 7,
    totalReps: 52,
    exercises: [
      {
        id: 'we1',
        name: 'Bench Press (Barbell)',
        order: 0,
        supersetId: null,
        notes: 'Paused reps',
        setCount: 4,
        volumeKg: 2400,
        bestSet: { weightKg: 85, reps: 5, volumeKg: 425 },
        sets: [
          { setIndex: 0, setType: 'WARMUP', weightKg: 40, reps: 10, distanceKm: null, durationSeconds: null, rpe: null, volumeKg: 400 },
          { setIndex: 1, setType: 'NORMAL', weightKg: 85, reps: 5, distanceKm: null, durationSeconds: null, rpe: 8.5, volumeKg: 425 },
          { setIndex: 2, setType: 'FAILURE', weightKg: 85, reps: 4, distanceKm: null, durationSeconds: null, rpe: 10, volumeKg: 340 },
          { setIndex: 3, setType: 'DROP', weightKg: 60, reps: 8, distanceKm: null, durationSeconds: null, rpe: null, volumeKg: 480 },
        ],
      },
      {
        id: 'we2',
        name: 'Dip',
        order: 1,
        supersetId: 1,
        notes: null,
        setCount: 3,
        volumeKg: 0,
        bestSet: null,
        sets: [{ setIndex: 0, setType: 'NORMAL', weightKg: null, reps: 12, distanceKm: null, durationSeconds: null, rpe: null, volumeKg: null }],
      },
    ],
    ...overrides,
  };
}

export function exerciseCard(overrides: Partial<ExerciseCard> = {}): ExerciseCard {
  return {
    id: 'e1',
    name: 'Bench Press (Barbell)',
    slug: 'bench-press-barbell',
    muscleGroup: 'CHEST',
    secondaryMuscles: ['TRICEPS'],
    equipment: 'BARBELL',
    kind: 'STRENGTH',
    isCustom: false,
    sessions: 8,
    totalSets: 32,
    totalReps: 160,
    totalVolumeKg: 12000,
    maxWeightKg: 90,
    best1RM: 102,
    totalDistanceKm: null,
    totalDurationSec: null,
    lastPerformedAt: '2026-09-28T18:00:00.000Z',
    firstPerformedAt: '2026-07-01T18:00:00.000Z',
    trend: 'up',
    sparkline: [80, 82, 85, 85, 88],
    ...overrides,
  };
}

export const exerciseCatalog: ExerciseCatalog = {
  groups: [
    {
      muscleGroup: 'CHEST',
      exerciseCount: 2,
      totalSets: 32,
      exercises: [exerciseCard(), exerciseCard({ id: 'e9', name: 'Cable Fly', slug: 'cable-fly', isCustom: true, sessions: 0, lastPerformedAt: null, trend: 'insufficient_data', sparkline: [] })],
    },
    {
      muscleGroup: 'CARDIO',
      exerciseCount: 1,
      totalSets: 4,
      exercises: [
        exerciseCard({
          id: 'e5',
          name: 'Treadmill',
          slug: 'treadmill',
          muscleGroup: 'CARDIO',
          secondaryMuscles: [],
          equipment: 'MACHINE',
          kind: 'CARDIO',
          maxWeightKg: null,
          totalDistanceKm: 12.5,
          totalDurationSec: 5400,
          trend: 'flat',
        }),
      ],
    },
  ],
  totals: { exercises: 3, performed: 2, neverPerformed: 1 },
};

export const exerciseDetail: ExerciseDetail = {
  exercise: {
    id: 'e1',
    name: 'Bench Press (Barbell)',
    slug: 'bench-press-barbell',
    muscleGroup: 'CHEST',
    secondaryMuscles: ['TRICEPS', 'SHOULDERS'],
    equipment: 'BARBELL',
    kind: 'STRENGTH',
    aliases: ['Développé couché'],
    isCustom: false,
  },
  summary: {
    sessions: 8,
    totalSets: 32,
    totalReps: 160,
    totalVolumeKg: 12000,
    avgSetsPerSession: 4,
    avgRepsPerSet: 5,
    avgWeightKg: 80,
    firstPerformedAt: '2026-07-01T18:00:00.000Z',
    lastPerformedAt: '2026-09-28T18:00:00.000Z',
    daysSinceLast: 3,
  },
  records: {
    maxWeight: { date: '2026-09-28T18:00:00.000Z', workoutId: 'w1', weightKg: 90, reps: 3 },
    best1RM: { date: '2026-09-28T18:00:00.000Z', workoutId: 'w1', value: 102, weightKg: 90, reps: 4 },
    maxVolumeSession: { date: '2026-09-21T18:00:00.000Z', workoutId: 'w0', value: 2600 },
    maxReps: { date: '2026-08-01T18:00:00.000Z', workoutId: 'w2', reps: 12, weightKg: 60 },
    longestDistanceKm: null,
    longestDurationSec: null,
    bestPaceMinPerKm: null,
  },
  progression: [
    { date: '2026-09-14T18:00:00.000Z', workoutId: 'w2', maxWeightKg: 85, est1RM: 97, volumeKg: 2200, totalReps: 20, setCount: 4, distanceKm: null, durationSeconds: null, isPR: false },
    { date: '2026-09-21T18:00:00.000Z', workoutId: 'w0', maxWeightKg: 87.5, est1RM: 99, volumeKg: 2600, totalReps: 22, setCount: 4, distanceKm: null, durationSeconds: null, isPR: true },
    { date: '2026-09-28T18:00:00.000Z', workoutId: 'w1', maxWeightKg: 90, est1RM: 102, volumeKg: 2400, totalReps: 18, setCount: 4, distanceKm: null, durationSeconds: null, isPR: true },
  ],
  history: {
    data: [
      {
        workoutId: 'w1',
        workoutTitle: 'Push Day',
        date: '2026-09-28T18:00:00.000Z',
        notes: null,
        supersetId: null,
        sessionVolumeKg: 2400,
        bestSet: { weightKg: 90, reps: 3, volumeKg: 270 },
        sets: [
          { setIndex: 0, setType: 'WARMUP', weightKg: 40, reps: 10, distanceKm: null, durationSeconds: null, rpe: null, volumeKg: 400, est1RM: null, isPR: false },
          { setIndex: 1, setType: 'NORMAL', weightKg: 90, reps: 3, distanceKm: null, durationSeconds: null, rpe: 9, volumeKg: 270, est1RM: 99, isPR: true },
        ],
      },
    ],
    meta: { page: 1, limit: 10, total: 12, totalPages: 2 },
  },
};

export function progressItem(overrides: Partial<ProgressItem> = {}): ProgressItem {
  return {
    exerciseId: 'e1',
    name: 'Bench Press (Barbell)',
    slug: 'bench-press-barbell',
    muscleGroup: 'CHEST',
    equipment: 'BARBELL',
    kind: 'STRENGTH',
    status: 'PLATEAU',
    metricUsed: 'est1RM',
    slopePctPerWeek: 0.1,
    sessionsAnalyzed: 6,
    current: { value: 100, date: '2026-09-28T18:00:00.000Z', workoutId: 'w1' },
    best: { value: 102, date: '2026-09-14T18:00:00.000Z', workoutId: 'w2' },
    weeksSincePR: 2,
    sessionsSinceImprovement: 3,
    lastPerformedAt: '2026-09-28T18:00:00.000Z',
    daysSinceLast: 3,
    sessions: [
      { date: '2026-09-14T18:00:00.000Z', value: 102, isPR: true },
      { date: '2026-09-21T18:00:00.000Z', value: 100, isPR: false },
      { date: '2026-09-28T18:00:00.000Z', value: 100, isPR: false },
    ],
    avgSetsPerSession: 4,
    weeklySetsAvg: 1.5,
    ...overrides,
  };
}

export const progressAlerts: ProgressAlertsResponse = {
  params: { windowWeeks: 12, sessions: 6, staleWeeks: 4, threshold: 0.5 },
  counts: { REGRESSING: 1, PLATEAU: 1, STALE: 1, PROGRESSING: 1, NOT_ENOUGH_DATA: 1 },
  items: [
    progressItem(),
    progressItem({ exerciseId: 'e2', name: 'Squat (Barbell)', slug: 'squat-barbell', status: 'REGRESSING', slopePctPerWeek: -1.2, muscleGroup: 'QUADS' }),
    progressItem({ exerciseId: 'e3', name: 'Lat Pulldown (Cable)', slug: 'lat-pulldown-cable', status: 'STALE', equipment: 'CABLE', muscleGroup: 'BACK', daysSinceLast: 40 }),
    progressItem({ exerciseId: 'e4', name: 'Deadlift (Barbell)', slug: 'deadlift-barbell', status: 'PROGRESSING', slopePctPerWeek: 1.4, weeklySetsAvg: 3 }),
    progressItem({ exerciseId: 'e5', name: 'Plank', slug: 'plank', status: 'NOT_ENOUGH_DATA', metricUsed: 'longestHoldSeconds', slopePctPerWeek: null, sessionsAnalyzed: 2, weeksSincePR: null }),
  ],
  muted: [{ exerciseId: 'e6', name: 'Running', slug: 'running', muteReason: 'Injury' }],
};

export const profile: ProfileResponse = {
  displayName: 'William Smith',
  username: 'william',
  email: 'william@example.com',
  avatarUrl: null,
  bio: 'Lifting.',
  location: 'Lyon',
  memberSince: '2026-07-01T10:00:00.000Z',
  weightUnit: 'kg',
  weekStart: 'monday',
  theme: 'system',
  bodyweightKg: 80,
  heightCm: 180,
  recapFrequency: 'weekly',
  recapWeekday: 1,
  recapMonthDay: 1,
  stats: { workouts: 12, level: 3, trophies: 5, streakWeeks: 4 },
};

export const hevyConnected: HevyConnectionState = {
  connected: true,
  apiKeyLast4: 'abcd',
  username: 'william_hevy',
  status: 'ACTIVE',
  lastSyncAt: '2026-09-30T10:00:00.000Z',
  lastSyncStatus: 'SUCCESS',
  workoutsInHevy: 14,
  workoutsLocal: 12,
  drift: 2,
};

export function syncRun(overrides: Partial<HevySyncRun> = {}): HevySyncRun {
  return {
    id: 'run1',
    trigger: 'MANUAL',
    status: 'SUCCESS',
    startedAt: '2026-09-30T10:00:00.000Z',
    finishedAt: '2026-09-30T10:00:42.000Z',
    requestCount: 5,
    pagesProcessed: 2,
    pagesTotal: 2,
    workoutsCreated: 2,
    workoutsUpdated: 1,
    workoutsDeleted: 0,
    workoutsMatched: 9,
    exercisesCreated: 0,
    warnings: null,
    error: null,
    ...overrides,
  };
}

export const syncRuns: Paginated<HevySyncRun> = {
  data: [
    syncRun(),
    syncRun({
      id: 'run0',
      trigger: 'CRON',
      status: 'PARTIAL',
      warnings: [
        { type: 'UNMAPPED_MUSCLE_GROUP', hevyTemplateId: 't1', exerciseTitle: 'Zercher Squat', rawValue: 'other' },
        { type: 'UNMATCHED_OVERLAPPING_WORKOUT', hevyId: 'h1', title: 'Leg Day', startedAt: '2026-09-29T10:00:00.000Z', existingWorkoutId: 'w7', existingTitle: 'Legs' },
      ],
    }),
    syncRun({ id: 'run-1', status: 'FAILED', error: 'Hevy rejected this key.', finishedAt: null }),
  ],
  meta: { page: 1, limit: 10, total: 3, totalPages: 1 },
};

export function importBatch(overrides: Partial<ImportBatchSummary> = {}): ImportBatchSummary {
  return {
    id: 'b1',
    fileName: 'workouts.csv',
    importedAt: '2026-09-20T10:00:00.000Z',
    rowCount: 120,
    workoutsCreated: 10,
    workoutsSkipped: 2,
    setsCreated: 200,
    workoutsStillPresent: 10,
    rollbackable: true,
    ...overrides,
  };
}

export function userCard(overrides: Partial<UserCard> = {}): UserCard {
  return { id: 'u2', username: 'lea.martin', displayName: 'Léa Martin', avatarUrl: null, friendship: 'none', requestId: null, ...overrides };
}

export const friendsOverview: FriendsOverview = {
  friends: [{ user: userCard({ friendship: 'friends' }), since: '2026-09-15T10:00:00.000Z' }],
  incoming: [{ id: 'r1', user: userCard({ id: 'u3', username: 'tom.durand', displayName: 'Tom Durand', friendship: 'incoming', requestId: 'r1' }), createdAt: '2026-09-29T10:00:00.000Z' }],
  outgoing: [{ id: 'r2', user: userCard({ id: 'u4', username: 'nina.rossi', displayName: 'Nina Rossi', friendship: 'outgoing', requestId: 'r2' }), createdAt: '2026-09-30T10:00:00.000Z' }],
};

export const leaderboard: LeaderboardEntry[] = [
  { user: userCard({ friendship: 'friends', avatarUrl: '/users/u2/avatar?v=1' }), weekVolumeKg: 8200, monthWorkouts: 6, trophies: 18 },
  { user: userCard({ id: 'u1', username: 'william', displayName: 'William Smith', friendship: 'self' }), weekVolumeKg: 5200, monthWorkouts: 8, trophies: 5 },
];

export const userPage: UserPage = {
  ...userCard({ friendship: 'friends', avatarUrl: '/users/u2/avatar?v=1' }),
  bio: 'Push, pull, legs.',
  location: 'Lyon',
  memberSince: '2026-07-15T10:00:00.000Z',
  stats: { workouts: 36, level: 6, trophies: 18, streakWeeks: 9 },
  recentTrophies: [{ code: 'SQUAT_100', name: 'Century Squat', icon: 'trophy', rarity: 'EPIC', xp: 300, unlockedAt: '2026-09-28T10:00:00.000Z' }],
  recentWorkouts: [{ title: 'Legs', startedAt: '2026-09-29T18:00:00.000Z', durationSec: 4200, exerciseCount: 1, totalVolumeKg: 6100 }],
};

export const authUser = {
  id: 'u1',
  email: 'william@example.com',
  username: 'william',
  displayName: 'William Smith',
  createdAt: '2026-07-01T10:00:00.000Z',
};

export type Overrides = Record<string, unknown>;

function routeOf(url: string): string {
  return url.replace(/^\/api/, '').split('?')[0] ?? '';
}

export function fakeApi(overrides: Overrides = {}) {
  return (url: string): unknown => {
    const path = routeOf(url);
    if (path in overrides) {
      return overrides[path];
    }
    if (path.startsWith('/stats/overview')) return overview;
    if (path.startsWith('/stats/timeseries')) return timeseries;
    if (path.startsWith('/stats/calendar')) return calendar;
    if (path.startsWith('/stats/muscle-heatmap')) return heatmap;
    if (path.startsWith('/stats/distribution')) return [];
    if (path.startsWith('/stats/balance')) return trainingBalance();
    if (path === '/achievements/summary') return achievementsSummary;
    if (path === '/achievements/unseen') return [];
    if (path === '/achievements') return achievementCatalog;
    if (path === '/goals') return goals;
    if (path === '/workouts/exercises') return [{ name: 'Bench Press (Barbell)', workoutCount: 8, lastPerformedAt: '2026-09-28T18:00:00.000Z' }];
    if (path === '/workouts') return workoutsPage;
    if (path.startsWith('/workouts/')) return workoutDetail({ id: path.split('/')[2] });
    if (path === '/exercises') return exerciseCatalog;
    if (path.startsWith('/exercises/')) return exerciseDetail;
    if (path === '/progress/alerts') return progressAlerts;
    if (path === '/progress/summary') return { counts: progressAlerts.counts, topConcerns: progressAlerts.items.slice(0, 2) };
    if (path === '/me/profile') return profile;
    if (path === '/hevy/connection') return hevyConnected;
    if (path === '/hevy/sync/runs') return syncRuns;
    if (path === '/imports') return { data: [importBatch()], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    if (path === '/friends') return friendsOverview;
    if (path === '/friends/leaderboard') return leaderboard;
    if (path === '/friends/requests/count') return { incoming: 0 };
    if (path === '/users/search') return [userCard()];
    if (path.startsWith('/users/')) return userPage;
    if (path === '/auth/me') return authUser;
    return {};
  };
}
