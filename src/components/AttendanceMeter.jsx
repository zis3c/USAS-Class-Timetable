import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AttendanceMeter({ percentStr = '85%' }) {
  const { lang, t } = useLanguage();
  const num = parseInt(percentStr, 10) || 85;

  let colorClass = 'bg-emerald-500';
  let isWarning = num < 80;
  let warningText = num < 80 
    ? (lang === 'ms' ? 'Di Bawah 80%' : 'Below 80%')
    : num < 85 
      ? (lang === 'ms' ? 'Rehat Perhatian' : 'Warning') 
      : null;

  if (num < 80) {
    colorClass = 'bg-red-500';
  } else if (num < 85) {
    colorClass = 'bg-amber-400';
  }

  return (
    <div className="space-y-1 w-full">
      <div className="flex items-center justify-between text-[10px] font-medium">
        <span className="text-white/60 flex items-center gap-1">
          {num < 80 ? (
            <ShieldAlert className="w-3 h-3 text-red-400" />
          ) : num < 85 ? (
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-emerald-400/80" />
          )}
          <span>{t('attendance')}: <strong className="text-white/90">{num}%</strong></span>
        </span>
        {warningText && (
          <span className={`text-[9px] font-bold ${num < 80 ? 'text-red-400' : 'text-amber-400'}`}>
            {warningText}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.min(num, 100)}%` }}
        />
      </div>
    </div>
  );
}
