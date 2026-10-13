import * as Sentry from '@sentry/react';

// Strip the query string so a shared payload (e.g. ?compare_schedule=<timetable>)
// is never sent to Sentry.
const withoutQuery = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.split('?')[0] : undefined;

// Sentry initialises only when VITE_SENTRY_DSN is set; app runs unchanged otherwise.
export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    beforeBreadcrumb(breadcrumb) {
      const data = breadcrumb.data;
      if (data) {
        if (typeof data.url === 'string') data.url = withoutQuery(data.url);
        if (typeof data.from === 'string') data.from = withoutQuery(data.from);
        if (typeof data.to === 'string') data.to = withoutQuery(data.to);
      }
      return breadcrumb;
    },
    beforeSend(event) {
      if (event.request) {
        const cleaned = withoutQuery(event.request.url);
        if (cleaned !== undefined) event.request.url = cleaned;
        delete event.request.query_string;
      }
      if (event.transaction) event.transaction = withoutQuery(event.transaction) ?? event.transaction;
      return event;
    },
  });
}
