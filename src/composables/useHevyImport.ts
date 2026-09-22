import { readonly, ref, type DeepReadonly, type Ref } from 'vue';

import { apiUrl, extractApiMessage } from '@/lib/api';
import type { ImportError, ImportResult, ImportStatus } from '@/types/imports';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const CSV_EXTENSION = /\.csv$/i;

export interface UseHevyImport {
  status: Readonly<Ref<ImportStatus>>;
  file: Readonly<Ref<File | null>>;
  error: Readonly<Ref<DeepReadonly<ImportError> | null>>;
  result: Readonly<Ref<DeepReadonly<ImportResult> | null>>;
  progress: Readonly<Ref<number>>;
  selectFile: (candidate: File | null | undefined) => boolean;
  upload: () => Promise<ImportResult | null>;
  reset: () => void;
}

/**
 * Owns the whole import lifecycle: one `status` ref drives the UI, the file is
 * sent as-is (never parsed here) and progress comes from XMLHttpRequest, which
 * is the only browser API that reports upload progress.
 *
 * No DOM access on purpose — the component keeps the refs and the file input.
 */
export function useHevyImport(): UseHevyImport {
  const status = ref<ImportStatus>('idle');
  const file = ref<File | null>(null);
  const error = ref<ImportError | null>(null);
  const result = ref<ImportResult | null>(null);
  const progress = ref(0);

  let request: XMLHttpRequest | null = null;

  function fail(message: string, httpStatus: number | null): void {
    error.value = { message, status: httpStatus };
    status.value = 'error';
  }

  /** Client-side gate: nothing leaves the browser until extension and size pass. */
  function selectFile(candidate: File | null | undefined): boolean {
    if (status.value === 'uploading') {
      return false;
    }

    error.value = null;
    result.value = null;
    progress.value = 0;

    if (!candidate) {
      file.value = null;
      status.value = 'idle';
      return false;
    }

    if (!CSV_EXTENSION.test(candidate.name)) {
      file.value = null;
      fail('Only .csv files are accepted. Export your workouts from Hevy as CSV.', null);
      return false;
    }

    if (candidate.size === 0) {
      file.value = null;
      fail('This file is empty.', null);
      return false;
    }

    if (candidate.size > MAX_FILE_BYTES) {
      file.value = null;
      fail('This file exceeds the 10 MB limit.', null);
      return false;
    }

    file.value = candidate;
    status.value = 'selected';
    return true;
  }

  function messageForStatus(httpStatus: number, apiMessage: string | null): string {
    if (httpStatus === 413) {
      return apiMessage ?? 'This file exceeds the 10 MB limit.';
    }

    if (httpStatus === 409) {
      return apiMessage ?? 'Another import is touching the same workouts. Try again.';
    }

    if (httpStatus >= 500) {
      return 'The server could not process this import. Try again in a moment.';
    }

    if (httpStatus >= 400) {
      return apiMessage ?? 'The server rejected this file.';
    }

    return `Unexpected response from the server (HTTP ${httpStatus}).`;
  }

  /** Resolves with the result, or null when the upload failed — never rejects. */
  function upload(): Promise<ImportResult | null> {
    if (status.value !== 'selected' || !file.value) {
      return Promise.resolve(null);
    }

    const payload = new FormData();
    payload.append('file', file.value, file.value.name);

    status.value = 'uploading';
    progress.value = 0;
    error.value = null;

    return new Promise<ImportResult | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      request = xhr;

      const settle = (value: ImportResult | null): void => {
        request = null;
        resolve(value);
      };

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          progress.value = Math.round((event.loaded / event.total) * 100);
        }
      });

      xhr.addEventListener('load', () => {
        // The bytes are in; the server is now parsing. Show a full bar meanwhile.
        progress.value = 100;

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            result.value = JSON.parse(xhr.responseText) as ImportResult;
            status.value = 'success';
            settle(result.value);
            return;
          } catch {
            fail('The server returned a malformed response.', xhr.status);
            settle(null);
            return;
          }
        }

        fail(messageForStatus(xhr.status, extractApiMessage(xhr.responseText)), xhr.status);
        settle(null);
      });

      xhr.addEventListener('error', () => {
        fail('Could not reach the server. Check your connection and try again.', null);
        settle(null);
      });

      xhr.addEventListener('timeout', () => {
        fail('The upload timed out. Try again.', null);
        settle(null);
      });

      // An abort comes from reset(), which already set the next status.
      xhr.addEventListener('abort', () => settle(null));

      xhr.open('POST', apiUrl('/imports/hevy'));
      xhr.responseType = 'text';
      xhr.send(payload);
    });
  }

  function reset(): void {
    request?.abort();
    request = null;
    status.value = 'idle';
    file.value = null;
    error.value = null;
    result.value = null;
    progress.value = 0;
  }

  return {
    status: readonly(status),
    file: readonly(file) as Readonly<Ref<File | null>>,
    error: readonly(error),
    result: readonly(result),
    progress: readonly(progress),
    selectFile,
    upload,
    reset,
  };
}
