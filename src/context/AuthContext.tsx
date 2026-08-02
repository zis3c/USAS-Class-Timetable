import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { loginStudentAPI, fetchTimetableAPI } from '../services/usasApi';
import type { AuthContextValue, StudentSession, TimetableData } from '../types/usas';

const AuthContext = createContext<AuthContextValue | null>(null);

const CACHE_KEY_SESSION = 'usas_student_session_cache';
const CACHE_KEY_TIMETABLE = 'usas_student_timetable_cache';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<StudentSession | null>(null);
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

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
      if (cachedSess) setSession(JSON.parse(cachedSess));
      if (cachedTime) setTimetableData(JSON.parse(cachedTime));
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
      const res = await loginStudentAPI(userId, password, isDemo);
      if (res.success) {
        setSession(res.data);
        try {
          sessionStorage.setItem(CACHE_KEY_SESSION, JSON.stringify(res.data));
        } catch (e) {}

        // Fetch timetable data
        const timetableRes = await fetchTimetableAPI(res.data);
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
        setLoading(false);
        return false;
      }
    } catch (err) {
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
