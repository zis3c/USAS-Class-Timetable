import React, { useState, useEffect } from 'react';
import { useNextPrayer } from './PrayerTimesWidget';
import { useTheme } from '@/app/providers/ThemeProvider';
import { X, Moon } from 'lucide-react';
import { useLanguage } from '@/app/providers/LanguageProvider';

export default function PrayerToast() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { lang } = useLanguage();
  
  const { nextPrayer, diffSeconds } = useNextPrayer();

  // Track if user manually dismissed for this specific prayer
  const [dismissedPrayerId, setDismissedPrayerId] = useState<string | null>(null);
  
  // Track if we've completed the 5 sec green state for this prayer
  const [completedPrayerId, setCompletedPrayerId] = useState<string | null>(null);
  
  // Local state for the "green" completion mode
  const [isCompleted, setIsCompleted] = useState(false);

  // If nextPrayer changes, reset completion state if it's a new prayer
  useEffect(() => {
    if (nextPrayer && nextPrayer.label !== completedPrayerId) {
      setIsCompleted(false);
    }
  }, [nextPrayer, completedPrayerId]);

  // Handle countdown and transition to green state
  useEffect(() => {
    if (!nextPrayer) return;

    if (diffSeconds === 0 && !isCompleted && nextPrayer.label !== completedPrayerId) {
      // Transition to complete!
      setIsCompleted(true);
      
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        setCompletedPrayerId(nextPrayer.label);
        setIsCompleted(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [diffSeconds, nextPrayer, isCompleted, completedPrayerId]);

  // TEST MODE
  const [testMode, setTestMode] = useState(false);
  const [testSeconds, setTestSeconds] = useState(10);

  useEffect(() => {
    const handleTest = () => {
      setTestMode(true);
      setTestSeconds(10);
      setIsCompleted(false);
      setDismissedPrayerId(null);
      setCompletedPrayerId(null);
    };
    window.addEventListener('test-prayer-toast', handleTest);
    return () => window.removeEventListener('test-prayer-toast', handleTest);
  }, []);

  useEffect(() => {
    if (testMode && testSeconds > 0) {
      const timer = setTimeout(() => setTestSeconds(s => s - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (testMode && testSeconds === 0 && !isCompleted) {
      setIsCompleted(true);
      const timer = setTimeout(() => {
        setIsCompleted(false);
        setTestMode(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [testMode, testSeconds, isCompleted]);

  // Determine if toast should be visible
  // Visible if: we have a nextPrayer AND it wasn't dismissed AND (it's <= 5 mins OR it is currently in 'completed' green state)
  const isVisible = testMode || Boolean(
    nextPrayer && 
    nextPrayer.label !== dismissedPrayerId && 
    nextPrayer.label !== completedPrayerId && 
    ((diffSeconds <= 300 && diffSeconds > 0) || isCompleted)
  );

  const handleDismiss = () => {
    if (testMode) {
      setTestMode(false);
      return;
    }
    if (nextPrayer) {
      setDismissedPrayerId(nextPrayer.label);
    }
  };

  if (!isVisible) return null;

  const currentPrayerLabel = testMode ? 'Maghrib (Test)' : nextPrayer?.label;
  const currentDiffSeconds = testMode ? testSeconds : diffSeconds;

  // Progress calculations (300 seconds total)
  const progressPercent = currentDiffSeconds > 0 && currentDiffSeconds <= 300 
    ? ((300 - currentDiffSeconds) / 300) * 100 
    : 100;

  // Format the time left e.g. "04:59"
  const minsLeft = Math.floor(currentDiffSeconds / 60);
  const secsLeft = currentDiffSeconds % 60;
  const timeStr = `${String(minsLeft).padStart(2, '0')}:${String(secsLeft).padStart(2, '0')}`;

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300 w-[280px] sm:w-[320px] rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-xl ${
      isCompleted
        ? (isLight 
            ? 'bg-emerald-500/90 border-emerald-400 text-white shadow-emerald-500/20' 
            : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100 shadow-emerald-900/50')
        : (isLight
            ? 'bg-white/95 border-slate-200 text-slate-800'
            : 'bg-[#0A1428]/95 border-white/10 text-white')
    }`}>
      <div className="p-4 flex items-start gap-3 relative">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${
          isCompleted 
            ? (isLight ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-emerald-500/30 border-emerald-400/50 text-emerald-300')
            : (isLight ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-400')
        }`}>
          <Moon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <h4 className={`text-sm font-bold truncate ${isCompleted ? 'text-current' : (isLight ? 'text-slate-900' : 'text-white')}`}>
            {isCompleted ? `Telah Masuk Waktu ${currentPrayerLabel}` : `Waktu ${currentPrayerLabel} Hampir Tiba`}
          </h4>
          <p className={`text-[11px] font-medium mt-0.5 ${isCompleted ? 'opacity-90' : (isLight ? 'text-slate-500' : 'text-white/60')}`}>
            {isCompleted 
              ? (lang === 'ms' ? 'Marilah mendirikan solat' : 'Time for prayer')
              : (lang === 'ms' ? `Azan berkumandang dalam ${timeStr}` : `Azan in ${timeStr}`)
            }
          </p>
        </div>

        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${
            isCompleted 
              ? 'hover:bg-black/10 text-current opacity-70 hover:opacity-100'
              : (isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-white/40 hover:bg-white/10')
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar (Only show during countdown) */}
      {!isCompleted && (
        <div className={`h-1.5 w-full relative ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}>
          <div 
            className="absolute top-0 left-0 h-full transition-all duration-1000 ease-linear rounded-r-full"
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: `color-mix(in oklch, #10b981 ${progressPercent}%, #ef4444)` 
            }}
          />
        </div>
      )}
    </div>
  );
}
