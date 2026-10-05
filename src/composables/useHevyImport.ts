import { t } from '@/i18n';
import { readonly, ref, type DeepReadonly, type Ref } from 'vue';

import { apiPost, apiUrl, authHeaders, extractApiMessage, ApiError } from '@/lib/api';
import { reportUnauthorized } from '@/lib/session-expiry';
import type { ImportError, ImportPreview, ImportResult, ImportStatus } from '@/types/imports';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const PREVIEW_PATH = '/imports/hevy/preview';

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

function messageForStatus(httpStatus: number, apiMessage: string | null): string {
  if (httpStatus === 413) {
    return apiMessage ?? t('errors.fileTooLarge');
  }
  if (httpStatus >= 500) {
    return t('errors.importServer');
  }
  if (httpStatus >= 400) {
    return apiMessage ?? t('errors.fileRejected');
  }
  return t('errors.unexpectedResponse', { status: httpStatus });
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
      fail(t('errors.csvOnly'), null);
      return;
    }

    if (candidate.size === 0) {
      file.value = null;
      fail(t('errors.fileEmpty'), null);
      return;
    }

    if (candidate.size > MAX_FILE_BYTES) {
      file.value = null;
      fail(t('errors.fileTooLarge'), null);
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
      const auth = authHeaders();

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
            fail(t('errors.malformed'), xhr.status);
          }
          settle();
          return;
        }

        reportUnauthorized(PREVIEW_PATH, xhr.status, 'Authorization' in auth);
        fail(messageForStatus(xhr.status, extractApiMessage(xhr.responseText)), xhr.status);
        settle();
      });

      xhr.addEventListener('error', () => {
        fail(t('errors.network'), null);
        settle();
      });

      xhr.addEventListener('timeout', () => {
        fail(t('errors.uploadTimeout'), null);
        settle();
      });

      xhr.addEventListener('abort', settle);

      xhr.open('POST', apiUrl(PREVIEW_PATH));
      for (const [name, value] of Object.entries(auth)) {
        xhr.setRequestHeader(name, value);
      }
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
    } catch (error_) {
      if (signal.aborted) {
        return null;
      }
      fail(
        error_ instanceof ApiError ? error_.message : t('errors.generic'),
        error_ instanceof ApiError ? error_.status : null,
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
