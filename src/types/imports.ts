import type { AchievementItem } from './achievements';

export interface ImportResult {
  batchId: string;
  alreadyImported: boolean;
  rowsParsed: number;
  workoutsFound: number;
  workoutsCreated: number;
  workoutsSkipped: number;
  setsCreated: number;
  divergedFromPreview?: boolean;
  newAchievements?: AchievementItem[];
}

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
  importBatchId: string | null;
}

export interface ImportPreview {
  stagedImportId: string;
  expiresAt: string;
  fileName: string;
  rowsParsed: number;
  summary: PreviewSummary;
  alreadyImportedFile: boolean;
  newWorkoutsPreview: StagedWorkoutPreview[];
  existingWorkouts: ExistingWorkoutRef[];
  warnings: string[];
}

export interface ImportBatchSummary {
  id: string;
  fileName: string;
  importedAt: string;
  rowCount: number;
  workoutsCreated: number;
  workoutsSkipped: number;
  setsCreated: number;
  workoutsStillPresent: number;
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
  workoutsKept: number;
}

export type ImportStatus =
  | 'idle'
  | 'uploading'
  | 'previewing'
  | 'confirming'
  | 'success'
  | 'error';

export interface ImportError {
  message: string;
  status: number | null;
}
