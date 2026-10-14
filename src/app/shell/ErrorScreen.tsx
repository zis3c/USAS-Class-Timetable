import { ArrowLeft, RefreshCw, ShieldAlert, WifiOff } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme, THEMES } from '@/app/providers/ThemeProvider';
import { getOwnRecordValue } from '@/shared/lib/security';

type ErrorScreenProps = {
  status: 404 | 500 | 502 | 503 | 504;
  title?: string;
  message?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  offline?: boolean;
};

const defaultCopy: Record<ErrorScreenProps['status'], { title: string; message: string; primary: string; secondary: string }> = {
  404: {
    title: 'Page not found',
    message: 'The route you opened does not exist in this app.',
    primary: 'Go home',
    secondary: 'Back',
  },
  500: {
    title: 'App error',
    message: 'Something broke while loading the page.',
    primary: 'Reload',
    secondary: 'Go home',
  },
  502: {
    title: 'Bad gateway',
    message: 'The upstream service returned a bad response.',
    primary: 'Try again',
    secondary: 'Go home',
  },
  503: {
    title: 'Service unavailable',
    message: 'The service is temporarily unavailable.',
    primary: 'Retry',
    secondary: 'Go home',
  },
  504: {
    title: 'Gateway timeout',
    message: 'The request took too long to complete.',
    primary: 'Retry',
    secondary: 'Go home',
  },
};

export default function ErrorScreen({
  status,
  title,
  message,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  offline = false,
}: ErrorScreenProps) {
  const { lang } = useLanguage();
  const { theme } = useTheme();

  const isLight = theme === THEMES.LIGHT;
  const copy = getOwnRecordValue<typeof defaultCopy[404]>(defaultCopy, status) || defaultCopy[404];
  const heading = title || copy.title;
  const body = message || copy.message;
  const primary = primaryLabel || copy.primary;
  const secondary = secondaryLabel || copy.secondary;
  const eyebrow = status === 404
    ? (lang === 'ms' ? 'Halaman tak dijumpai' : 'Page not found')
    : (lang === 'ms' ? 'Ralat aplikasi' : 'Application error');

  return (
    <div
      className={`flex min-h-[100svh] w-full items-center justify-center px-4 py-6 ${
        isLight ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#060E1F] text-slate-100'
      }`}
    >
      <div className="w-full max-w-md">
        <div
          className={`w-full rounded-2xl border p-5 shadow-xl ${
            isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#0A1428] border-white/[0.08] shadow-black/30'
          }`}
        >
          <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${
            isLight
              ? 'border-slate-200 bg-slate-50 text-[#0B1E43]'
              : 'border-white/10 bg-white/5 text-slate-300'
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>USAS Class Timetable</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                offline
                  ? 'bg-sky-500/10 border-sky-400/20 text-sky-400'
                  : isLight
                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                    : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
              }`}
            >
              {offline ? <WifiOff className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>

            <div className="min-w-0">
              <div className={`text-[9px] font-bold uppercase tracking-[0.16em] ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                {eyebrow}
              </div>
              <h1 className="mt-0.5 text-xl font-extrabold leading-tight tracking-tight text-balance">
                {heading}
              </h1>
            </div>
          </div>

          <p className={`mt-3 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {body}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onPrimary}
              className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold transition-colors ${
                isLight ? 'bg-[#0B1E43] text-white hover:bg-[#152e63]' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              {primary}
            </button>
            <button
              type="button"
              onClick={onSecondary}
              className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors ${
                isLight ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50' : 'border-white/[0.08] bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              {secondary}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



