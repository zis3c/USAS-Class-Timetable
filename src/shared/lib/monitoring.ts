import * as Sentry from '@sentry/react';

// Sentry initialises only when VITE_SENTRY_DSN is set; app runs unchanged otherwise.
export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });
}
