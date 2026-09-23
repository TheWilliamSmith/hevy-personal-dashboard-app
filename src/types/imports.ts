/**
 * Mirrors api/src/imports/dto/* — verified field-for-field against the running
 * API. Volumes are JSON numbers rounded to one decimal; instants are ISO 8601
 * UTC strings, matching the wall-clock-as-UTC convention of the importer.
 */

import type { AchievementItem } from './achievements';

/* -------------------------------------------------------------------- result */

export interface ImportResult {
  batchId: string;
  alreadyImported: boolean;
  rowsParsed: number;
  workoutsFound: number;
  workoutsCreated: number;
  workoutsSkipped: number;
  setsCreated: number;
  /**
   * Only the confirm endpoint sets this. True when the diff recomputed at
   * confirm time no longer matches what the preview reported.
   */
  divergedFromPreview?: boolean;
  /**
   * Achievements this import unlocked. Specified, NOT sent by the API yet:
   * the confirm endpoint runs the achievement sync but discards its result.
   */
  newAchievements?: AchievementItem[];
}

/* ------------------------------------------------------------------- preview */

export interface PreviewSummary {
  newWorkouts: number;
  existingWorkouts: number;
  newSets: number;
}

export interface StagedWorkoutPreview {
  externalKey: string;
  title: string;
  startedAt: string;
  durationSec: number;
  exerciseCount: number;
  setCount: number;
  totalVolumeKg: number;
  exerciseNames: string[];
}

export interface ExistingWorkoutRef {
  externalKey: string;
  title: string;
  startedAt: string;
  importedAt: string;
  /** Null for workouts imported before batches tracked their workouts. */
  importBatchId: string | null;
}

export interface ImportPreview {
  stagedImportId: string;
  /** The staged payload is dropped after this instant. */
  expiresAt: string;
  fileName: string;
  rowsParsed: number;
  summary: PreviewSummary;
  alreadyImportedFile: boolean;
  /** Full list — the client paginates it. */
  newWorkoutsPreview: StagedWorkoutPreview[];
  existingWorkouts: ExistingWorkoutRef[];
  /** Non-fatal observations; fatal problems come back as a 400. */
  warnings: string[];
}

/* ------------------------------------------------------------------ batches */

export interface ImportBatchSummary {
  id: string;
  fileName: string;
  importedAt: string;
  rowCount: number;
  workoutsCreated: number;
  workoutsSkipped: number;
  setsCreated: number;
  /** Workouts still linked to this batch right now. */
  workoutsStillPresent: number;
  /** False when the batch owns no workout, which makes a rollback a 409. */
  rollbackable: boolean;
}

export interface BatchWorkout {
  id: string;
  title: string;
  startedAt: string;
  exerciseCount: number;
  setCount: number;
  totalVolumeKg: number;
}

export interface ImportBatchDetail extends ImportBatchSummary {
  workouts: BatchWorkout[];
}

export interface RollbackResult {
  batchId: string;
  workoutsDeleted: number;
  setsDeleted: number;
  /** Workouts left in place when deleteWorkouts was false. */
  workoutsKept: number;
}

/* -------------------------------------------------------------------- state */

/**
 * The import is a two-step flow now: upload produces a preview, and nothing is
 * written until confirm.
 */
export type ImportStatus =
  | 'idle'
  | 'uploading'
  | 'previewing'
  | 'confirming'
  | 'success'
  | 'error';

/** `status` is null when the request never reached the API. */
export interface ImportError {
  message: string;
  status: number | null;
}
