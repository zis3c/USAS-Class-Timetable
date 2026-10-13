const REPO_URL = 'https://github.com/zis3c/USAS-Class-Timetable';

const U545 = [
  '█   █ █████ █   █ █████',
  '█   █ █     █   █ █    ',
  '█   █ ████  █████ ████ ',
  '█   █     █     █     █',
  ' ███  ████      █ ████ ',
].join('\n');

export function logConsoleBanner(): void {
  if (typeof console === 'undefined') return;
  const version = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

  // eslint-disable-next-line no-console -- intentional console easter egg
  console.log(
    `%c${U545}\n%cUSAS Class Timetable\n%cDibina oleh pelajar, untuk pelajar.\n%cversion: ${version}\n%csource: ${REPO_URL}`,
    'color:#fbbf24;font-family:ui-monospace,Menlo,monospace;font-size:12px',
    'font-size:15px;font-weight:800;color:#fbbf24',
    'color:#94a3b8;font-size:12px',
    'color:#64748b;font-size:11px;font-family:ui-monospace,monospace',
    'color:#38bdf8;font-size:12px',
  );
}
