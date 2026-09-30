type Listener = () => void;

let listener: Listener | null = null;
let notified = false;

export function onSessionExpired(next: Listener): void {
  listener = next;
  notified = false;
}

export function notifySessionExpired(): void {
  if (notified || !listener) {
    return;
  }
  notified = true;
  listener();
}

const PUBLIC_AUTH_PATHS = ['/auth/sign-in', '/auth/sign-up', '/auth/password/'];

export function isPublicAuthPath(path: string): boolean {
  return PUBLIC_AUTH_PATHS.some((prefix) => path.startsWith(prefix));
}

export function reportUnauthorized(path: string, status: number, sentToken: boolean): void {
  if (status === 401 && sentToken && !isPublicAuthPath(path)) {
    notifySessionExpired();
  }
}
