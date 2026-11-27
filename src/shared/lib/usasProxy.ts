const ALLOWED_USAS_ENDPOINTS = new Set([
  '/student/login_student.php',
  '/student/get_student_profile.php',
  '/student/get_timetable_stud.php',
  '/student/get_kehadiran_kuliah.php',
  '/student/get_scan_qr_v2.php',
  '/student/get_directory_staff_v2.php',
]);

export function getUsasProxyPath(pathname: string): string | null {
  if (!pathname.startsWith('/api/usas')) return null;

  const upstreamPath = pathname.replace(/^\/api\/usas/, '') || '/';
  const cleanPath = upstreamPath.startsWith('/') ? upstreamPath : `/${upstreamPath}`;

  return ALLOWED_USAS_ENDPOINTS.has(cleanPath) ? cleanPath : null;
}

export function isAllowedUsasMethod(method: string): boolean {
  return method.toUpperCase() === 'POST';
}

export const MAX_USAS_BODY_BYTES = 64 * 1024;

// Reject missing Content-Length too: a chunked request without it would bypass
// a size check based only on the header value.
export function hasAllowedBodySize(rawContentLength: string | null): boolean {
  const length = Number(rawContentLength ?? '');
  return Number.isFinite(length) && length > 0 && length <= MAX_USAS_BODY_BYTES;
}
