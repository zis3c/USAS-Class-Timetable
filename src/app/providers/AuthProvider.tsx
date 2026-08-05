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
} from '@/shared/lib/security';
import {
  restoreSessionFromCache,
  restoreThrottleState,
  restoreTimetableFromCache,
} from '@/shared/lib/cache';

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
      return restoreThrottleState(cached) || getEmptyThrottleState();
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
      if (cachedSess) {
        const restoredSession = restoreSessionFromCache(cachedSess);
        if (restoredSession) setSession(restoredSession);
      }
      if (cachedTime) {
        const restoredTimetable = restoreTimetableFromCache(cachedTime);
        if (restoredTimetable) setTimetableData(restoredTimetable);
      }
    } catch {
      // ignore cache restore failures
    }

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
        return false;
      }

      const throttleState = readThrottleState();
      const throttleCheck = evaluateLoginThrottle(throttleState);
      if (!isDemo && !throttleCheck.allowed) {
        setError(`Log masuk disekat seketika. Cuba lagi selepas ${formatRetryAt(throttleCheck.retryAt)}.`);
        return false;
      }

      const res = await loginStudentAPI(userId, password, isDemo);
      if (res.success) {
        const safeSession = sanitizeSession(res.data);
        setSession(safeSession);
        try {
          sessionStorage.setItem(CACHE_KEY_SESSION, JSON.stringify(safeSession));
        } catch {
          // ignore storage failures
        }
        writeThrottleState(recordLoginSuccess(throttleState));

        try {
          const timetableRes = await fetchTimetableAPI(safeSession);
          setTimetableData(timetableRes);
          try {
            localStorage.setItem(CACHE_KEY_TIMETABLE, JSON.stringify(timetableRes));
          } catch {
            // ignore storage failures
          }
        } catch {
          setTimetableData(null);
          setError('Gagal memuat jadual.');
        }
        return true;
      } else {
        if ('error' in res) {
          setError(res.error);
        }
        if (!isDemo) {
          writeThrottleState(recordLoginFailure(throttleState));
        }
        return false;
      }
    } catch (err) {
      if (!isDemo) {
        const throttleState = readThrottleState();
        writeThrottleState(recordLoginFailure(throttleState));
      }
      setError("Ralat sistem semasa log masuk.");
      return false;
    } finally {
      setLoading(false);
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
    } catch {
      // ignore storage failures
    }
  };

  const refreshTimetable = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetchTimetableAPI(session);
      setTimetableData(res);
      try {
        localStorage.setItem(CACHE_KEY_TIMETABLE, JSON.stringify(res));
      } catch {
        // ignore storage failures
      }
    } catch {
      setError('Gagal memuat jadual.');
    } finally {
      setLoading(false);
    }
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




