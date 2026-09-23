import { readonly, ref, type DeepReadonly, type Ref } from 'vue';

import { apiPost, apiUrl, extractApiMessage, ApiError } from '@/lib/api';
import type { ImportError, ImportPreview, ImportResult, ImportStatus } from '@/types/imports';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const CSV_EXTENSION = /\.csv$/i;

export interface UseHevyImport {
  status: Readonly<Ref<ImportStatus>>;
  file: Readonly<Ref<File | null>>;
  preview: Readonly<Ref<DeepReadonly<ImportPreview> | null>>;
  result: Readonly<Ref<DeepReadonly<ImportResult> | null>>;
  error: Readonly<Ref<DeepReadonly<ImportError> | null>>;
  progress: Readonly<Ref<number>>;
  selectFile: (candidate: File | null | undefined) => void;
  cancel: () => void;
  confirm: () => Promise<ImportResult | null>;
  reset: () => void;
}

export function useHevyImport(): UseHevyImport {
  const status = ref<ImportStatus>('idle');
  const file = ref<File | null>(null);
  const preview = ref<ImportPreview | null>(null);
  const result = ref<ImportResult | null>(null);
  const error = ref<ImportError | null>(null);
  const progress = ref(0);

  let request: XMLHttpRequest | null = null;
  let controller: AbortController | null = null;

  function fail(message: string, httpStatus: number | null): void {
    error.value = { message, status: httpStatus };
    status.value = 'error';
  }

  function messageForStatus(httpStatus: number, apiMessage: string | null): string {
    if (httpStatus === 413) {
      return apiMessage ?? 'This file exceeds the 10 MB limit.';
    }
    if (httpStatus >= 500) {
      return 'The server could not process this import. Try again in a moment.';
    }
    if (httpStatus >= 400) {
      return apiMessage ?? 'The server rejected this file.';
    }
    return `Unexpected response from the server (HTTP ${httpStatus}).`;
  }

  function selectFile(candidate: File | null | undefined): void {
    if (status.value === 'uploading' || status.value === 'confirming') {
      return;
    }

    error.value = null;
    result.value = null;
    preview.value = null;
    progress.value = 0;

    if (!candidate) {
      file.value = null;
      status.value = 'idle';
      return;
    }

    if (!CSV_EXTENSION.test(candidate.name)) {
      file.value = null;
      fail('Only .csv files are accepted. Export your workouts from Hevy as CSV.', null);
      return;
    }

    if (candidate.size === 0) {
      file.value = null;
      fail('This file is empty.', null);
      return;
    }

    if (candidate.size > MAX_FILE_BYTES) {
      file.value = null;
      fail('This file exceeds the 10 MB limit.', null);
      return;
    }

    file.value = candidate;
    void upload(candidate);
  }

  function upload(candidate: File): Promise<void> {
    const payload = new FormData();
    payload.append('file', candidate, candidate.name);

    status.value = 'uploading';
    progress.value = 0;

    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      request = xhr;

      const settle = (): void => {
        request = null;
        resolve();
      };

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          progress.value = Math.round((event.loaded / event.total) * 100);
        }
      });

      xhr.addEventListener('load', () => {
        progress.value = 100;

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            preview.value = JSON.parse(xhr.responseText) as ImportPreview;
            status.value = 'previewing';
          } catch {
            fail('The server returned a malformed response.', xhr.status);
          }
          settle();
          return;
        }

        fail(messageForStatus(xhr.status, extractApiMessage(xhr.responseText)), xhr.status);
        settle();
      });

      xhr.addEventListener('error', () => {
        fail('Could not reach the server. Check your connection and try again.', null);
        settle();
      });

      xhr.addEventListener('timeout', () => {
        fail('The upload timed out. Try again.', null);
        settle();
      });

      xhr.addEventListener('abort', settle);

      xhr.open('POST', apiUrl('/imports/hevy/preview'));
      xhr.responseType = 'text';
      xhr.send(payload);
    });
  }

  async function confirm(): Promise<ImportResult | null> {
    const staged = preview.value;
    if (status.value !== 'previewing' || !staged) {
      return null;
    }

    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;

    status.value = 'confirming';
    error.value = null;

    try {
      const confirmed = await apiPost<ImportResult>(
        '/imports/hevy/confirm',
        { stagedImportId: staged.stagedImportId },
        signal,
      );

      result.value = confirmed;
      preview.value = null;
      status.value = 'success';
      return confirmed;
    } catch (caught) {
      if (signal.aborted) {
        return null;
      }
      fail(
        caught instanceof ApiError ? caught.message : 'Something went wrong.',
        caught instanceof ApiError ? caught.status : null,
      );
      return null;
    } finally {
      controller = null;
    }
  }

  function cancel(): void {
    request?.abort();
    controller?.abort();
    request = null;
    controller = null;
    preview.value = null;
    file.value = null;
    error.value = null;
    progress.value = 0;
    status.value = 'idle';
  }

  function reset(): void {
    cancel();
    result.value = null;
  }

  return {
    status: readonly(status),
    file: readonly(file) as Readonly<Ref<File | null>>,
    preview: readonly(preview),
    result: readonly(result),
    error: readonly(error),
    progress: readonly(progress),
    selectFile,
    cancel,
    confirm,
    reset,
  };
}
