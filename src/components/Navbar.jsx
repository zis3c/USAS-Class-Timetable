import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, Menu, RefreshCw, Sparkles, WifiOff } from 'lucide-react';

export default function Navbar({ onOpenTools, onOpenPdfModal }) {
  const { session, timetableData, logout, refreshTimetable, loading, isOffline } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <header className="h-12 flex-shrink-0 navbar-border bg-[#060E1F]/98 backdrop-blur-2xl px-4 sm:px-6 relative z-50">
      <div className="h-full w-full px-2 sm:px-4 flex items-center justify-between">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <img src="/usas-logo.png" alt="USAS" className="w-7 h-7 object-contain" />
          <div className="hidden sm:block">
            <h1 className="text-xs font-bold text-white/90 tracking-tight leading-none">USAS</h1>
            <p className="text-[9px] text-white/40 font-medium">{t('portalSubtitle')}</p>
          </div>
          {session?.isDemo && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/15">
              <Sparkles className="w-2 h-2" /> {t('demoMode')}
            </span>
          )}
          {isOffline && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500/10 text-red-400">
              <WifiOff className="w-2 h-2" /> {t('offlineMode')}
            </span>
          )}
        </div>


        {/* Right: Minimal Actions */}
        <div className="flex items-center gap-1.5">
          {/* Language toggle — tiny pill */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[9.5px] font-bold text-amber-400 hover:text-amber-300 border border-white/10 transition-colors flex items-center gap-1"
          >
            <span>{lang === 'ms' ? 'Bahasa Melayu' : 'English'}</span>
          </button>

          {session && (
            <>
              {/* Refresh — icon only */}
              <button
                onClick={refreshTimetable}
                disabled={loading}
                className="p-1.5 rounded-md text-white/30 hover:text-white/60 transition-colors disabled:opacity-30"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              </button>

              {/* Tools menu — single entry point for ALL actions */}
              <button
                onClick={onOpenTools}
                className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-1.5 rounded-md text-white/20 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
