import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, RefreshCw, Sparkles, WifiOff } from 'lucide-react';

type NavbarProps = {
  onOpenTools: () => void;
  onOpenPdfModal?: () => void;
};

export default function Navbar({ onOpenTools }: NavbarProps) {
  const { session, refreshTimetable, loading, isOffline } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { theme } = useTheme();

  const isLight = theme === 'light';

  return (
    <header className={`h-11 flex-shrink-0 border-b px-4 sm:px-6 relative z-50 transition-colors duration-150 ${isLight
        ? 'bg-white border-slate-200 text-slate-800'
        : 'bg-[#060E1F]/98 border-white/[0.06] backdrop-blur-md text-white'
      }`}>
      <div className="h-full w-full flex items-center justify-between">

        {/* Left: Brand & Badges */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {session && (
            <div className="flex items-center gap-2">
              <img src="/usas-logo.png" alt="USAS Logo" className="w-5 h-5 object-contain" />
              <span className={`text-[11px] font-medium tracking-normal whitespace-nowrap ${isLight ? 'text-slate-800' : 'text-white'
                }`}>
                <span className="inline sm:hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>USAS</span>
                <span className="hidden sm:inline" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>USAS Class Timetable</span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {session?.isDemo && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold border flex-shrink-0 ${isLight
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-amber-400/10 text-amber-400 border-amber-400/15'
                }`}>
                <Sparkles className="w-2.5 h-2.5" /> {t('demoMode')}
              </span>
            )}
            {isOffline && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold border flex-shrink-0 ${isLight
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                <WifiOff className="w-2.5 h-2.5" /> {t('offlineMode')}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5 flex-1 justify-end">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            aria-label="Toggle language"
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${isLight
                ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                : 'text-amber-400/70 hover:text-amber-300 hover:bg-white/[0.06]'
              }`}
          >
            {lang === 'ms' ? 'BM' : 'EN'}
          </button>

          {session && (
            <>
              {/* Refresh */}
              <button
                onClick={refreshTimetable}
                disabled={loading}
                aria-label="Refresh timetable"
                className={`p-1.5 rounded-md transition-colors disabled:opacity-30 ${isLight
                    ? 'text-slate-650 hover:text-slate-950 hover:bg-slate-100'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                  }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Tools menu */}
              <button
                onClick={onOpenTools}
                aria-label="Open tools and export"
                className={`p-1.5 rounded-md transition-colors ${isLight
                    ? 'text-slate-650 hover:text-slate-950 hover:bg-slate-100'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                  }`}
              >
                <Menu className="w-4 h-4" />
              </button>

            </>
          )}
        </div>

      </div>
    </header>
  );
}
