import { describe, expect, it } from 'vitest';
import { getUsasProxyPath, hasAllowedBodySize, isAllowedUsasMethod } from '../src/shared/lib/usasProxy';

describe('usas proxy allowlist', () => {
  it('allows only the explicit endpoint set', () => {
    expect(getUsasProxyPath('/api/usas/student/login_student.php')).toBe('/student/login_student.php');
    expect(getUsasProxyPath('/api/usas/student/get_student_profile.php')).toBe('/student/get_student_profile.php');
    expect(getUsasProxyPath('/api/usas/student/get_timetable_stud.php')).toBe('/student/get_timetable_stud.php');
    expect(getUsasProxyPath('/api/usas/student/get_kehadiran_kuliah.php')).toBe('/student/get_kehadiran_kuliah.php');
    expect(getUsasProxyPath('/api/usas/student/get_scan_qr_v2.php')).toBe('/student/get_scan_qr_v2.php');
    expect(getUsasProxyPath('/api/usas/student/delete_everything.php')).toBeNull();
    expect(getUsasProxyPath('/api/usas/../admin')).toBeNull();
  });

  it('allows only post requests', () => {
    expect(isAllowedUsasMethod('POST')).toBe(true);
    expect(isAllowedUsasMethod('GET')).toBe(false);
    expect(isAllowedUsasMethod('DELETE')).toBe(false);
  });

  it('requires a bounded content length', () => {
    expect(hasAllowedBodySize('1024')).toBe(true);
    expect(hasAllowedBodySize('0')).toBe(false);
    expect(hasAllowedBodySize(null)).toBe(false);
    expect(hasAllowedBodySize('70000')).toBe(false);
    expect(hasAllowedBodySize('not-a-number')).toBe(false);
  });
});
