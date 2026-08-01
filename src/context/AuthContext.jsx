import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginStudentAPI, fetchTimetableAPI } from '../services/usasApi';

const AuthContext = createContext(null);

const CACHE_KEY_SESSION = 'usas_student_session_cache';
const CACHE_KEY_TIMETABLE = 'usas_student_timetable_cache';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  const login = async (userId, password, isDemo = false) => {
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
        if (timetableRes.success) {
          setTimetableData(timetableRes);
          try {
            localStorage.setItem(CACHE_KEY_TIMETABLE, JSON.stringify(timetableRes));
          } catch (e) {}
        } else {
          setError(timetableRes.error || "Gagal memuat jadual.");
        }
        setLoading(false);
        return true;
      } else {
        setError(res.error);
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
    if (res.success) {
      setTimetableData(res);
      try {
        localStorage.setItem(CACHE_KEY_TIMETABLE, JSON.stringify(res));
      } catch (e) {}
    } else {
      setError(res.error);
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
