/** Keeps an incoming `?compare_schedule=` payload alive across the login flow via sessionStorage (cleared on tab close). */
const PENDING_COMPARE_KEY = 'usas_pending_compare_schedule';

export function savePendingCompareData(data: string): void {
  if (!data) return;
  try {
    sessionStorage.setItem(PENDING_COMPARE_KEY, data);
  } catch {
    // Ignore storage failures (private mode / quota); the URL param still works this tab.
  }
}

export function readPendingCompareData(): string | null {
  try {
    return sessionStorage.getItem(PENDING_COMPARE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingCompareData(): void {
  try {
    sessionStorage.removeItem(PENDING_COMPARE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
