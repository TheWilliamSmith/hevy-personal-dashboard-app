import type { AchievementItem } from './achievements';

export type HevySyncStatus = 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';

export type HevySyncTrigger = 'MANUAL' | 'SCHEDULED' | 'AFTER_CONNECT';

export interface FlaggedExercise {
  name: string;
  externalKey: string;
}

export interface HevySyncRun {
  id: string;
  trigger: HevySyncTrigger;
  status: HevySyncStatus;
  full: boolean;
  startedAt: string;
  finishedAt: string | null;
  durationSec: number | null;
  requestCount: number;
  workoutsCreated: number;
  workoutsUpdated: number;
  workoutsDeleted: number;
  workoutsMatched: number;
  errorMessage: string | null;
  flaggedExercises: FlaggedExercise[];
  newAchievements?: AchievementItem[];
}

export interface HevyConnected {
  connected: true;
  username: string;
  keyMasked: string;
  connectedAt: string;
  lastSyncAt: string | null;
  lastSyncStatus: HevySyncStatus | null;
  hevyWorkoutCount: number;
  localWorkoutCount: number;
  activeSyncRunId: string | null;
}

export interface HevyNotConnected {
  connected: false;
}

export type HevyConnectionState = HevyConnected | HevyNotConnected;

export type ConnectHevyErrorKind = 'invalid-format' | 'rejected' | 'not-pro' | 'network' | 'unknown';

export interface ConnectHevyError {
  kind: ConnectHevyErrorKind;
  message: string;
}
