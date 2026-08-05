import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { loginStudentAPI, fetchTimetableAPI } from '@/services/usas/usasApi';
import type { AuthContextValue, StudentSession, TimetableData } from '@/shared/types/usas';
import {
  evaluateLoginThrottle,
  formatRetryAt,
  getEmptyThrottleState,
  recordLoginFailure,
  recordLoginSuccess,
  sanitizeSession,
  sanitizeLoginUserId,
  sanitizeTimetableItem,
} from '@/shared/lib/security';

const AuthContext = createContext<AuthContextValue | null>(null);

const CACHE_KEY_SESSION = 'usas_student_session_cache';
const CACHE_KEY_TIMETABLE = 'usas_student_timetable_cache';
const CACHE_KEY_LOGIN_THROTTLE = 'usas_login_throttle_cache';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<StudentSession | null>(null);
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const readThrottleState = () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY_LOGIN_THROTTLE);
      if (!cached) return getEmptyThrottleState();
      const parsed = JSON.parse(cached) as ReturnType<typeof getEmptyThrottleState>;
      return {
        failedAttempts: Number(parsed.failedAttempts) || 0,
        lockedUntil: Number(parsed.lockedUntil) || 0,
        lastAttemptAt: Number(parsed.lastAttemptAt) || 0,
      };
    } catch {
      return getEmptyThrottleState();
    }
  };

  const writeThrottleState = (nextState: ReturnType<typeof getEmptyThrottleState>) => {
    try {
      sessionStorage.setItem(CACHE_KEY_LOGIN_THROTTLE, JSON.stringify(nextState));
    } catch {
      // ignore storage failures
    }
  };

  // Track network status for PWA offline mode
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Restore cached timetable for offline PWA access
    try {
      const cachedSess = sessionStorage.getItem(CACHE_KEY_SESSION);
      const cachedTime = localStorage.getItem(CACHE_KEY_TIMETABLE);
      if (cachedSess) setSession(sanitizeSession(JSON.parse(cachedSess)));
      if (cachedTime) {
        const parsed = JSON.parse(cachedTime) as TimetableData;
        setTimetableData({
          ...parsed,
          timetable: Array.isArray(parsed.timetable) ? parsed.timetable.map(sanitizeTimetableItem) : [],
          days: Array.isArray(parsed.days) ? parsed.days.map((day) => String(day).toUpperCase()) : [],
        });
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const login = async (userId: string, password: string, isDemo = false) => {
    setLoading(true);
    setError(null);
    try {
      const normalizedUserId = sanitizeLoginUserId(userId);
      if (!isDemo && !normalizedUserId) {
        setError('Isi no. matrik yang sah.');
        setLoading(false);
        return false;
      }

      const throttleState = readThrottleState();
      const throttleCheck = evaluateLoginThrottle(throttleState);
      if (!isDemo && !throttleCheck.allowed) {
        setError(`Log masuk disekat seketika. Cuba lagi selepas ${formatRetryAt(throttleCheck.retryAt)}.`);
        setLoading(false);
        return false;
      }

      const res = await loginStudentAPI(userId, password, isDemo);
      if (res.success) {
        const safeSession = sanitizeSession(res.data);
        setSession(safeSession);
        try {
          sessionStorage.setItem(CACHE_KEY_SESSION, JSON.stringify(safeSession));
        } catch (e) {}
        writeThrottleState(recordLoginSuccess(throttleState));

        // Fetch timetable data
        const timetableRes = await fetchTimetableAPI(safeSession);
        setTimetableData(timetableRes);
        try {
          localStorage.setItem(CACHE_KEY_TIMETABLE, JSON.stringify(timetableRes));
        } catch (e) {}
        setLoading(false);
        return true;
      } else {
        if ('error' in res) {
          setError(res.error);
        }
        if (!isDemo) {
          writeThrottleState(recordLoginFailure(throttleState));
        }
        setLoading(false);
        return false;
      }
    } catch (err) {
      if (!isDemo) {
        const throttleState = readThrottleState();
        writeThrottleState(recordLoginFailure(throttleState));
      }
      setError("Ralat sistem semasa log masuk.");
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setSession(null);
    setTimetableData(null);
    setError(null);
    try {
      sessionStorage.removeItem(CACHE_KEY_SESSION);
      sessionStorage.removeItem(CACHE_KEY_LOGIN_THROTTLE);
      localStorage.removeItem(CACHE_KEY_TIMETABLE);
    } catch (e) {}
  };

  const refreshTimetable = async () => {
    if (!session) return;
    setLoading(true);
    const res = await fetchTimetableAPI(session);
    setTimetableData(res);
    try {
      localStorage.setItem(CACHE_KEY_TIMETABLE, JSON.stringify(res));
    } catch (e) {}
    if (!res) {
      setError('Gagal memuat jadual.');
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      session,
      timetableData,
      loading,
      error,
      isOffline,
      login,
      logout,
      refreshTimetable,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}




