import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

type AttendanceMeterProps = {
  percentStr?: string;
};

export default function AttendanceMeter({ percentStr = '85%' }: AttendanceMeterProps) {
  const { lang, t } = useLanguage();
  const { theme } = useTheme();
  const num = parseInt(percentStr, 10) || 85;

  const isLight = theme === 'light';
  const getProgressColor = (value: number): string => {
    const clamped = Math.max(0, Math.min(value, 100));
    const hue = (clamped / 100) * 120;
    return `hsl(${hue} 85% 52%)`;
  };

  let warningText = num < 80 
    ? (lang === 'ms' ? 'Di Bawah 80%' : 'Below 80%')
    : num < 85 
      ? (lang === 'ms' ? 'Rehat Perhatian' : 'Warning') 
      : null;
  const colorClass = getProgressColor(num);

  return (
    <div className="space-y-1 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[10px] font-medium">
        <span className={`flex items-center gap-1 min-w-0 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
          {num < 80 ? (
            <ShieldAlert className={`w-3 h-3 ${isLight ? 'text-red-650' : 'text-red-400'}`} />
          ) : num < 85 ? (
            <AlertTriangle className={`w-3 h-3 ${isLight ? 'text-amber-600' : 'text-amber-500'}`} />
          ) : (
            <CheckCircle2 className={`w-3 h-3 ${isLight ? 'text-emerald-600' : 'text-emerald-400/80'}`} />
          )}
          <span className="truncate">{t('attendance')}: <strong className={`font-bold ${isLight ? 'text-slate-800' : 'text-white/90'}`}>{num}%</strong></span>
        </span>
        {warningText && (
          <span className={`text-[9px] font-bold self-start sm:self-auto ${num < 80 ? (isLight ? 'text-red-700' : 'text-red-400') : (isLight ? 'text-amber-700' : 'text-amber-400')}`}>
            {warningText}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className={`w-full h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/[0.06]'}`}>
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(num, 100)}%`, backgroundColor: colorClass }}
        />
      </div>
    </div>
  );
}
