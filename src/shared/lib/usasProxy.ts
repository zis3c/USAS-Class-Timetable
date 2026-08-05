const ALLOWED_USAS_ENDPOINTS = new Set([
  '/student/login_student.php',
  '/student/get_student_profile.php',
  '/student/get_timetable_stud.php',
  '/student/get_kehadiran_kuliah.php',
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
