/**
 * Mirrors ImportHevyResultDto from the API (src/imports/dto/import-result.dto.ts).
 * Keep both sides in sync when the backend DTO changes.
 */
export interface ImportResult {
  batchId: string;
  alreadyImported: boolean;
  rowsParsed: number;
  workoutsFound: number;
  workoutsCreated: number;
  workoutsSkipped: number;
  setsCreated: number;
}

export type ImportStatus = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

/**
 * `status` is null when the request never reached the API (network failure),
 * so the UI can tell "server said no" from "server never answered".
 */
export interface ImportError {
  message: string;
  status: number | null;
}
