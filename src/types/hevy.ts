import type { AchievementItem } from './achievements';

export type HevySyncStatus = 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';

export type HevySyncTrigger = 'MANUAL' | 'CRON' | 'POST_CONNECT';

export type HevySyncWarning =
  | {
      type: 'UNMAPPED_MUSCLE_GROUP';
      hevyTemplateId: string;
      exerciseTitle: string;
      rawValue: string | null;
    }
  | {
      type: 'UNMATCHED_OVERLAPPING_WORKOUT';
      hevyId: string;
      title: string;
      startedAt: string;
      existingWorkoutId: string;
      existingTitle: string;
    };

export interface HevySyncRun {
  id: string;
  trigger: HevySyncTrigger;
  status: HevySyncStatus;
  startedAt: string;
  finishedAt: string | null;
  requestCount: number;
  pagesProcessed: number;
  pagesTotal: number | null;
  workoutsCreated: number;
  workoutsUpdated: number;
  workoutsDeleted: number;
  workoutsMatched: number;
  exercisesCreated: number;
  warnings: HevySyncWarning[] | null;
  error: string | null;
  newAchievements?: AchievementItem[];
}

export interface HevyConnected {
  connected: true;
  apiKeyLast4: string | null;
  username: string | null;
  status: 'ACTIVE' | 'INVALID' | 'UNAUTHORIZED' | 'UNKNOWN' | null;
  lastSyncAt: string | null;
  lastSyncStatus: HevySyncStatus | null;
  workoutsInHevy: number | null;
  workoutsLocal: number | null;
  drift: number | null;
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
