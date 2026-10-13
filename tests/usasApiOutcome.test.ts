import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  loginStudentAPI,
  fetchTimetableAPI,
  fetchAttendanceHistoryAPI,
  searchLecturerDirectoryAPI,
  UsasUnavailableError,
} from '../src/services/usas/Api';
import type { StudentSession } from '../src/shared/types/usas';

const session: StudentSession = {
  status: 1,
  user_id: 'I00000000',
  sid_1: 'sid-1',
  sid_2: 'sid-2',
  sid_3: 'sid-3',
  isDemo: false,
};

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  text: async () => JSON.stringify(body),
});

const errorResponse = (status: number, body: unknown) => ({
  ok: false,
  status,
  headers: { get: () => 'application/json' },
  text: async () => JSON.stringify(body),
});

beforeEach(() => {
  vi.stubGlobal('window', {
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('loginStudentAPI network handling', () => {
  it('returns a friendly error when the network is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const res = await loginStudentAPI('I00000000', 'secret', false, 'token');

    expect(res.success).toBe(false);
    if (res.success === false) expect(res.error).toMatch(/Tidak dapat hubungi/);
  });

  it('surfaces the captcha gate error from a 403 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      errorResponse(403, { success: false, error: 'Pengesahan captcha gagal. Sila cuba lagi.', 'error-codes': ['invalid-input-secret'] }),
    ));

    const res = await loginStudentAPI('I00000000', 'secret', false, 'bad-token');

    expect(res.success).toBe(false);
    if (res.success === false) expect(res.error).toMatch(/captcha/i);
  });

  it('includes Turnstile error codes when the proxy omits a message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      errorResponse(403, { success: false, 'error-codes': ['invalid-input-secret'] }),
    ));

    const res = await loginStudentAPI('I00000000', 'secret', false, 'bad-token');

    expect(res.success).toBe(false);
    if (res.success === false) {
      expect(res.error).toMatch(/captcha/i);
      expect(res.error).toMatch(/invalid-input-secret/);
    }
  });

  it('returns a session on a successful login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      server_response: [{ status: 1, sid_1: 's1', sid_2: 's2', sid_3: 's3' }],
    })));

    const res = await loginStudentAPI('I00000000', 'secret', false, 'token');

    expect(res.success).toBe(true);
    if (res.success) expect(res.data.sid_1).toBe('s1');
  });
});

describe('fetchTimetableAPI unavailable fallback', () => {
  it('throws UsasUnavailableError when every endpoint is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(fetchTimetableAPI(session)).rejects.toBeInstanceOf(UsasUnavailableError);
  });
});

describe('fetchAttendanceHistoryAPI session guard', () => {
  it('returns no history and skips the API call without a session', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAttendanceHistoryAPI(null, 'group-1')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('searchLecturerDirectoryAPI', () => {
  it('parses entries, strips HTML tags and normalises the e-mail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      server_response_directory: [
        { id: 0, info: 'header row' },
        { id: 1, nama: '<b>LECTURER NAME</b>', jawatan: 'PENSYARAH', email: 'Lecturer@USAS.edu.my', ext: '-', no_staff: 'PSH000' },
      ],
    })));

    const rows = await searchLecturerDirectoryAPI(session, 'lecturer');

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('LECTURER NAME');
    expect(rows[0].email).toBe('lecturer@usas.edu.my');
    expect(rows[0].position).toBe('PENSYARAH');
  });

  it('returns an empty list when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'server error',
    }));

    expect(await searchLecturerDirectoryAPI(session, 'lecturer')).toEqual([]);
  });

  it('does not call the API in demo mode', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const rows = await searchLecturerDirectoryAPI({ ...session, isDemo: true }, 'lecturer');

    expect(rows).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
