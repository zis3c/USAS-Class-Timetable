import { useState, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { generateTimetablePdf, generateElementPng, generateLockscreenImage } from '@/features/export/lib/pdfGenerator';
import type { TimetableItem } from '@/shared/types/usas';
import { 
  X, Download, Smartphone, RotateCw, Award, ChevronDown, Plus, Minus
} from 'lucide-react';

type PdfExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ExportMode = 'FORMAL_A4' | 'WALLPAPER';
type ExportFileType = 'PDF' | 'PNG';
type WallpaperPreset = 'phone' | 'tablet' | 'desktop' | 'square';
type ContentDetail = 'CODE' | 'DETAILS';
type ExportTheme = 'light' | 'dark';

const getModalDayColors = (day: string | undefined, isLight: boolean) => {
  const darkColors = {
    'ISNIN':  { bg: 'bg-emerald-500/25', border: 'border-emerald-500/40', text: 'text-emerald-300 font-bold' },
    'SELASA': { bg: 'bg-blue-500/25',    border: 'border-blue-500/40',    text: 'text-blue-300 font-bold' },
    'RABU':   { bg: 'bg-amber-500/25',   border: 'border-amber-500/40',   text: 'text-amber-300 font-bold' },
    'KHAMIS': { bg: 'bg-purple-500/25',  border: 'border-purple-500/40',  text: 'text-purple-300 font-bold' },
    'JUMAAT': { bg: 'bg-rose-500/25',    border: 'border-rose-500/40',    text: 'text-rose-300 font-bold' },
    'SABTU':  { bg: 'bg-orange-500/25',  border: 'border-orange-500/40',  text: 'text-orange-300 font-bold' },
    'AHAD':   { bg: 'bg-slate-500/25',   border: 'border-slate-500/40',   text: 'text-slate-300 font-bold' },
  };
  const lightColors = {
    'ISNIN':  { bg: 'bg-emerald-100/80', border: 'border-emerald-300', text: 'text-emerald-800 font-bold' },
    'SELASA': { bg: 'bg-blue-100/80',    border: 'border-blue-300',    text: 'text-blue-800 font-bold' },
    'RABU':   { bg: 'bg-amber-100/90',   border: 'border-amber-350',   text: 'text-amber-800 font-bold' },
    'KHAMIS': { bg: 'bg-purple-100/80',  border: 'border-purple-300',  text: 'text-purple-800 font-bold' },
    'JUMAAT': { bg: 'bg-rose-100/80',    border: 'border-rose-300',    text: 'text-rose-800 font-bold' },
    'SABTU':  { bg: 'bg-orange-100/80',  border: 'border-orange-300',  text: 'text-orange-800 font-bold' },
    'AHAD':   { bg: 'bg-slate-200/80',   border: 'border-slate-350',   text: 'text-slate-805 font-bold' },
  };
  return (isLight ? lightColors[day] : darkColors[day]) || (isLight ? lightColors['ISNIN'] : darkColors['ISNIN']);
};

const getPresetStyle = (preset: WallpaperPreset, detail: ContentDetail = 'DETAILS') => {
  const base = {
    phone: {
      tableFontSize: 'text-[5.75px]',
      thPadding: 'p-0.5',
      tdPadding: 'p-0.5',
      minH: 'min-h-[34px]',
      courseTitleSize: 'text-[6px] font-black leading-none text-center',
      courseSubSize: 'text-[5px] leading-tight line-clamp-2 text-center break-words',
      courseLocSize: 'text-[4.5px] leading-none text-center font-medium',
      durationSize: 'text-[4.4px] leading-none text-center font-semibold',
      iconSize: 'w-1.5 h-1.5',
    },
    square: {
      tableFontSize: 'text-[7px]',
      thPadding: 'p-0.5',
      tdPadding: 'p-0.5',
      minH: 'min-h-[40px]',
      courseTitleSize: 'text-[7px] font-black leading-none text-center',
      courseSubSize: 'text-[6px] leading-tight line-clamp-2 text-center break-words',
      courseLocSize: 'text-[5.5px] leading-none text-center font-medium',
      durationSize: 'text-[5px] leading-none text-center font-semibold',
      iconSize: 'w-2 h-2',
    },
    tablet: {
      tableFontSize: 'text-[8px]',
      thPadding: 'p-1',
      tdPadding: 'p-1',
      minH: 'min-h-[46px]',
      courseTitleSize: 'text-[8.5px] font-black leading-none text-center',
      courseSubSize: 'text-[7px] leading-tight line-clamp-2 text-center break-words',
      courseLocSize: 'text-[6px] leading-none text-center font-medium',
      durationSize: 'text-[5.8px] leading-none text-center font-semibold',
      iconSize: 'w-2.5 h-2.5',
    },
    desktop: {
      tableFontSize: 'text-[9px]',
      thPadding: 'p-1.5',
      tdPadding: 'p-1',
      minH: 'min-h-[52px]',
      courseTitleSize: 'text-[9.5px] font-black leading-none text-center',
      courseSubSize: 'text-[8.2px] leading-tight line-clamp-2 text-center break-words',
      courseLocSize: 'text-[7px] leading-none text-center font-medium',
      durationSize: 'text-[6.5px] leading-none text-center font-semibold',
      iconSize: 'w-3 h-3',
    },
  };

  const detailTweaks = {
    CODE: {
      phone: { minH: 'min-h-[24px]', courseTitleSize: 'text-[7.2px] font-black leading-none text-center tracking-tight', durationSize: 'text-[4px] leading-none text-center font-semibold' },
      square: { minH: 'min-h-[32px]', courseTitleSize: 'text-[8.4px] font-black leading-none text-center tracking-tight', durationSize: 'text-[4.6px] leading-none text-center font-semibold' },
      tablet: { minH: 'min-h-[38px]', courseTitleSize: 'text-[10px] font-black leading-none text-center tracking-tight', durationSize: 'text-[5.2px] leading-none text-center font-semibold' },
      desktop: { minH: 'min-h-[44px]', courseTitleSize: 'text-[11.8px] font-black leading-none text-center tracking-tight', durationSize: 'text-[5.8px] leading-none text-center font-semibold' },
    },
    DETAILS: {
      phone: { minH: 'min-h-[26px]', courseTitleSize: 'text-[6.8px] font-black leading-none text-center tracking-tight', courseLocSize: 'text-[3.8px] leading-none text-center font-medium', durationSize: 'text-[3.8px] leading-none text-center font-semibold' },
      square: { minH: 'min-h-[34px]', courseTitleSize: 'text-[8px] font-black leading-none text-center tracking-tight', courseLocSize: 'text-[4.5px] leading-none text-center font-medium', durationSize: 'text-[4.5px] leading-none text-center font-semibold' },
      tablet: { minH: 'min-h-[40px]', courseTitleSize: 'text-[9.4px] font-black leading-none text-center tracking-tight', courseLocSize: 'text-[5.1px] leading-none text-center font-medium', durationSize: 'text-[5px] leading-none text-center font-semibold' },
      desktop: { minH: 'min-h-[46px]', courseTitleSize: 'text-[10.8px] font-black leading-none text-center tracking-tight', courseLocSize: 'text-[5.8px] leading-none text-center font-medium', durationSize: 'text-[5.8px] leading-none text-center font-semibold' },
    },
  };

  return {
    ...base[preset],
    ...(detailTweaks[detail]?.[preset] || {}),
  };
};

const WALLPAPER_HOUR_STARTS = [8, 9, 10, 11, 12, 13, 14, 15, 16];

const parseTimeToMinutes = (timeStr?: string) => {
  if (!timeStr) return null;
  const raw = String(timeStr).trim();
  const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const twentyFourMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
  const match = ampmMatch || twentyFourMatch;
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const suffix = ampmMatch ? ampmMatch[3].toUpperCase() : null;
  const normalizedHour = suffix === 'PM' && hour < 12 ? hour + 12 : suffix === 'AM' && hour === 12 ? 0 : hour;
  return normalizedHour * 60 + minute;
};

const formatAmPmTime = (timeStr?: string) => {
  if (!timeStr) return '';
  const raw = String(timeStr).trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr;
  
  const hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const ampm = match[3].toLowerCase();
  
  const minStr = min === 0 ? '' : `:${String(min).padStart(2, '0')}`;
  return `${hour}${minStr}${ampm}`;
};

const formatDurationRange = (startTime?: string, endTime?: string) => {
  if (!startTime && !endTime) return '-';
  const start = formatAmPmTime(startTime);
  const end = formatAmPmTime(endTime);
  if (!start) return end;
  if (!end) return start;
  return `${start} - ${end}`;
};

const formatWallpaperSlotLabel = (hour: number) => {
  const start = String(hour).padStart(2, '0');
  const end = String(hour + 1).padStart(2, '0');
  return `${start}-${end}`;
};

const formatShortDurationLabel = (startTime?: string, endTime?: string) => {
  const startParsed = parseTimeToMinutes(startTime);
  const endParsed = parseTimeToMinutes(endTime);
  if (startParsed == null || endParsed == null || endParsed <= startParsed) return '';
  const hours = Math.max(1, Math.round((endParsed - startParsed) / 60));
  return `${hours}hr${hours > 1 ? 's' : ''}`;
};

export default function PdfExportModal({ isOpen, onClose }: PdfExportModalProps) {
  const { timetableData, session } = useAuth();
  const { lang, t } = useLanguage();
  const { theme } = useTheme();
  
  const isLight = theme === 'light';
  
  // Modes: 'FORMAL_A4' | 'WALLPAPER'
  const [exportMode, setExportMode] = useState<ExportMode>('FORMAL_A4'); 
  const [exportFileType, setExportFileType] = useState<ExportFileType>('PDF');
  
  // Device Wallpaper Presets: 'phone' (9:16) | 'tablet' (4:3) | 'desktop' (16:9) | 'square' (1:1)
  const [wallpaperPreset, setWallpaperPreset] = useState<WallpaperPreset>('phone');

  // Content Detail Customizer: 'CODE' | 'DETAILS'
  const [contentDetail, setContentDetail] = useState<ContentDetail>('DETAILS');

  const [ratioDropdownOpen, setRatioDropdownOpen] = useState(false);
  const [detailDropdownOpen, setDetailDropdownOpen] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewHeight, setPreviewHeight] = useState(0);
  const [userZoom, setUserZoom] = useState(1);
  const [exportTheme, setExportTheme] = useState<ExportTheme>('light');
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [wallpaperYOffset, setWallpaperYOffset] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setExportTheme(theme === 'light' ? 'light' : 'dark');
    }
  }, [theme, isOpen]);
  
  useEffect(() => {
    setUserZoom(1);
  }, [exportMode]);

  const finalScale = previewScale * userZoom;
  const isExportLight = exportTheme === 'light';

  const renderFloatingZoomWidget = (isLightBg) => (
    <div className={`absolute top-6 left-4 z-30 w-fit flex items-center gap-1.5 p-1 rounded-xl shadow-lg border backdrop-blur-xl transition-all pointer-events-auto ${
      isLightBg 
        ? 'bg-white/90 border-slate-200 text-slate-700 shadow-slate-900/5' 
        : 'bg-[#0A1428]/90 border-white/10 text-white/95 shadow-black/20'
    }`}>
      <button
        onClick={(e) => { e.stopPropagation(); setUserZoom(prev => Math.max(0.5, prev - 0.1)); }}
        className={`p-1.5 rounded-lg transition-all ${
          isLightBg ? 'hover:bg-slate-100/80 text-slate-650' : 'hover:bg-white/[0.08] text-white/80'
        }`}
        title="Zoom Out"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      
      <button
        onClick={(e) => { e.stopPropagation(); setUserZoom(1); }}
        className={`px-2 py-1 rounded-lg text-[10.5px] font-extrabold transition-all min-w-[42px] text-center ${
          isLightBg ? 'hover:bg-slate-100/80 text-slate-700' : 'hover:bg-white/[0.08] text-white/90'
        }`}
        title="Reset Zoom"
      >
        {Math.round(userZoom * 100)}%
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); setUserZoom(prev => Math.min(2.5, prev + 0.1)); }}
        className={`p-1.5 rounded-lg transition-all ${
          isLightBg ? 'hover:bg-slate-100/80 text-slate-650' : 'hover:bg-white/[0.08] text-white/80'
        }`}
        title="Zoom In"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
  
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const previewShellRef = useRef<HTMLDivElement | null>(null);
  const wallpaperRef = useRef<HTMLDivElement | null>(null);

  const allCourses = useMemo(() => timetableData?.timetable || [], [timetableData?.timetable]);
  const studentName = timetableData?.studentName || session?.user_id || 'Pelajar USAS';
  const matricNo = session?.user_id || 'AI210042';
  const programName = timetableData?.program || 'FAKULTI TEKNOLOGI & SAINS MAKLUMAT';
  const semesterStr = timetableData?.semester || 'Semester Semasa';

  const normalizeGroup = (groupStr?: string) => {
    if (!groupStr) return 'Group 1';
    const raw = String(groupStr).trim();
    const match = raw.match(/^(?:GRP|G)\s*0*(\d+)$/i);
    if (match) return `Group ${match[1]}`;
    if (/^A$/i.test(raw)) return 'Group A';
    return raw.replace(/^GRP/i, 'Group ');
  };

  const daysList = useMemo(() => {
    if (timetableData?.days && timetableData.days.length > 0) {
      return timetableData.days;
    }
    const defaultOrder = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'];
    const daysInCourses = new Set(allCourses.map(c => c.day?.toUpperCase()).filter(Boolean));
    const baseDays = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];
    const extraDays = defaultOrder.filter(d => daysInCourses.has(d) && !baseDays.includes(d));
    return [...baseDays, ...extraDays];
  }, [timetableData?.days, allCourses]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setAnimate(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!shouldRender || exportMode === 'WALLPAPER') return;

    const previewWidth = exportMode === 'FORMAL_A4' ? 840 : 920;
    const updateScale = () => {
      if (!previewShellRef.current) return;
      const availableWidth = previewShellRef.current.clientWidth || previewWidth;
      const baseScale = Math.min(1, availableWidth / previewWidth);
      const mobileBoost = window.innerWidth < 640 ? 0.9 : window.innerWidth < 1024 ? 0.95 : 1;
      const nextScale = Math.max(0.72, baseScale * mobileBoost);
      setPreviewScale(Number(nextScale.toFixed(3)));
    };

    const updateHeight = () => {
      if (!pdfRef.current) return;
      setPreviewHeight(pdfRef.current.offsetHeight || 0);
    };

    updateScale();
    updateHeight();

    const shellObserver = typeof ResizeObserver !== 'undefined' && previewShellRef.current
      ? new ResizeObserver(updateScale)
      : null;
    if (shellObserver && previewShellRef.current) shellObserver.observe(previewShellRef.current);

    const contentObserver = typeof ResizeObserver !== 'undefined' && pdfRef.current
      ? new ResizeObserver(updateHeight)
      : null;
    if (contentObserver && pdfRef.current) contentObserver.observe(pdfRef.current);

    window.addEventListener('resize', updateScale);

    return () => {
      shellObserver?.disconnect();
      contentObserver?.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [shouldRender, exportMode, contentDetail, wallpaperPreset, daysList, allCourses.length]);

  const getWallpaperCourseForHour = (dayName: string, hourStart: number): TimetableItem | null => {
    return allCourses.find(c => {
      const isDay = c.day?.toUpperCase() === dayName.toUpperCase();
      if (!isDay) return false;
      const startMinutes = parseTimeToMinutes(c.start_time || c.jadual || '');
      if (startMinutes == null) return false;
      const courseStartHour = Math.floor(startMinutes / 60);
      return courseStartHour === hourStart;
    }) || null;
  };

  const getWallpaperCourseSpan = (course: TimetableItem): number => {
    const startMinutes = parseTimeToMinutes(course.start_time || course.jadual || '');
    const endMinutes = parseTimeToMinutes(course.end_time || '');
    if (startMinutes == null) return 1;
    const safeEnd = endMinutes != null && endMinutes > startMinutes ? endMinutes : startMinutes + 60;
    return Math.max(1, Math.ceil((safeEnd - startMinutes) / 60));
  };

  const isWallpaperSlotCovered = (dayName: string, hourStart: number): boolean => {
    return allCourses.some(c => {
      if ((c.day?.toUpperCase() || '') !== dayName.toUpperCase()) return false;
      const startMinutes = parseTimeToMinutes(c.start_time || c.jadual || '');
      const endMinutes = parseTimeToMinutes(c.end_time || '');
      if (startMinutes == null) return false;
      const courseStartHour = Math.floor(startMinutes / 60);
      const safeEnd = endMinutes != null && endMinutes > startMinutes ? endMinutes : startMinutes + 60;
      const span = Math.max(1, Math.ceil((safeEnd - startMinutes) / 60));
      const courseEndHour = courseStartHour + span;
      return hourStart > courseStartHour && hourStart < courseEndHour;
    });
  };

  if (!shouldRender) return null;

  const handleDownload = async () => {
    setExporting(true);
    setProgress(0);
    setProgressStatus(lang === 'en' ? 'Preparing template...' : 'Menyediakan template...');
    
    // Smooth progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) {
          // Slow down progress increments as we approach completion
          return prev + 1 >= 95 ? 95 : prev + 1;
        }
        // Rapid growth in the beginning
        if (prev < 40) return prev + Math.floor(Math.random() * 8) + 4;
        return prev + Math.floor(Math.random() * 4) + 1;
      });
    }, 150);

    // Update statuses based on progress
    const statusInterval = setInterval(() => {
      setProgress((curr) => {
        if (curr < 30) {
          setProgressStatus(lang === 'en' ? 'Initializing render engine...' : 'Memulakan enjin jana...');
        } else if (curr < 65) {
          setProgressStatus(lang === 'en' ? 'Rendering high-resolution elements...' : 'Menjana grafik resolusi tinggi...');
        } else if (curr < 90) {
          setProgressStatus(lang === 'en' ? 'Compiling download package...' : 'Menyusun fail muat turun...');
        }
        return curr;
      });
    }, 500);

    // Yield control to the browser event loop to paint the progress overlay
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      if (exportMode === 'WALLPAPER') {
        const filename = `USAS_Lockscreen_${wallpaperPreset.toUpperCase()}_${contentDetail}_${matricNo}.png`;
        await generateLockscreenImage(wallpaperRef.current, filename);
      } else if (exportFileType === 'PNG') {
        const filename = `Jadual_USAS_Formal_${matricNo}_LANDSCAPE.png`;
        await generateElementPng(pdfRef.current, filename, 8, '#FFFFFF');
      } else {
        const filename = `Jadual_USAS_Formal_${matricNo}_LANDSCAPE.pdf`;
        await generateTimetablePdf(pdfRef.current, 'landscape', filename);
      }
      
      // Complete progress on success
      clearInterval(interval);
      clearInterval(statusInterval);
      setProgress(100);
      setProgressStatus(lang === 'en' ? 'Download completed!' : 'Muat turun berjaya!');
      
      // Delay before closing loading overlay
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (err) {
      clearInterval(interval);
      clearInterval(statusInterval);
      console.error('Export Error:', err);
      alert(lang === 'ms' ? 'Gagal menjana fail. Sila cuba lagi.' : 'Failed to generate file. Please try again.');
    } finally {
      setExporting(false);
      setProgress(0);
    }
  };

  const fileTypeOptions: Array<{ id: ExportFileType; label: string }> = [
    { id: 'PDF', label: 'PDF' },
    { id: 'PNG', label: 'PNG' },
  ];

  const ratioOptions: Array<{ id: WallpaperPreset; label: string }> = [
    { id: 'phone', label: `${t('phonePreset')} (9:16)` },
    { id: 'tablet', label: `${t('tabletPreset')} (4:3)` },
    { id: 'desktop', label: `${t('desktopPreset')} (16:9)` },
    { id: 'square', label: `${t('squarePreset')} (1:1)` },
  ];

  const detailOptions: Array<{ id: ContentDetail; label: string }> = [
    { id: 'CODE', label: t('codeOnly') },
    { id: 'DETAILS', label: t('details') },
  ];

  const themeOptions: Array<{ id: ExportTheme; label: string }> = [
    { id: 'light', label: t('themeLight') },
    { id: 'dark', label: t('themeDark') },
  ];

  const renderWallpaperCourseContent = (
    course: TimetableItem,
    span: number,
    badgeHeightPx: number,
    isLight: boolean,
    style: {
      tableFontSize: string;
      thPadding: string;
      tdPadding: string;
      minH: string;
      courseTitleSize: string;
      courseSubSize?: string;
      courseLocSize: string;
      durationSize: string;
      iconSize: string;
    }
  ) => {
    const code = course.course_id || course.kod_kursus;
    const loc = course.location || 'Dewan USAS';
    const duration = formatDurationRange(course.start_time || course.jadual, course.end_time);
    const shortDuration = formatShortDurationLabel(course.start_time || course.jadual, course.end_time);
    const codeOnlyFontSize = (() => {
      const baseSize = (() => {
        if (wallpaperPreset === 'phone') {
          if (code.length > 8) return 7.5;
          if (code.length > 6) return 8.2;
          if (code.length > 4) return 9.0;
          return 10.0;
        }
        if (wallpaperPreset === 'square') {
          if (code.length > 8) return 9.5;
          if (code.length > 6) return 10.5;
          if (code.length > 4) return 11.5;
          return 12.5;
        }
        if (wallpaperPreset === 'tablet') {
          if (code.length > 8) return 10.5;
          if (code.length > 6) return 11.5;
          if (code.length > 4) return 12.5;
          return 13.5;
        }
        if (code.length > 8) return 10.0;
        if (code.length > 6) return 11.0;
        if (code.length > 4) return 12.0;
        return 13.0;
      })();
      if (contentDetail === 'CODE') return baseSize * 1.25;
      return baseSize;
    })();
    return (
      <div
        className="w-full flex flex-col justify-center items-center text-center p-0.5 overflow-hidden"
        style={{ height: `${badgeHeightPx - 2}px` }}
      >
        {contentDetail === 'DETAILS' ? (
          <div className="w-full flex flex-col justify-center items-center text-center gap-0.5">
            <div className={`w-full text-center ${style.durationSize} leading-normal font-bold ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
              <span className="break-words text-center leading-tight">{shortDuration || duration}</span>
            </div>
            <div className="w-full text-center">
              <span
                className={`block w-full break-words font-black leading-normal tracking-tight text-center ${
                  isLight ? 'text-slate-800' : 'text-white'
                }`}
                style={{ fontSize: `${codeOnlyFontSize}px` }}
                title={code}
              >
                {code}
              </span>
            </div>
            <div className={`w-full text-center ${style.courseLocSize} leading-normal font-semibold ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
              <span className="break-words whitespace-normal text-center" title={loc}>{loc}</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center text-center">
            <span
              className={`inline-block break-words leading-normal tracking-tight text-center font-black ${isLight ? 'text-slate-800' : 'text-white'}`}
              style={{ fontSize: `${codeOnlyFontSize}px`, letterSpacing: '-0.03em' }}
              title={code}
            >
              {code}
            </span>
          </div>
        )}
      </div>
    );
  };

  const getSpacerHeights = (preset: WallpaperPreset, offset = 0) => {
    const top = preset === 'desktop' ? 56 : preset === 'square' ? 64 : preset === 'tablet' ? 104 : 96;
    const bottom = preset === 'desktop' ? 28 : preset === 'square' ? 24 : preset === 'tablet' ? 22 : 18;
    const clampedOffset = Math.max(-48, Math.min(48, offset));
    return {
      top: Math.max(12, top + clampedOffset),
      bottom: Math.max(8, bottom - clampedOffset),
      offset: clampedOffset,
    };
  };

  const currentSpacers = getSpacerHeights(wallpaperPreset, wallpaperYOffset);

  return (
    <div data-lenis-prevent className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md transition-all duration-200 touch-pan-y overscroll-contain ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      
      {/* Spacious Modal Frame */}
      <div className={`rounded-xl w-[96vw] max-w-6xl h-[92dvh] max-h-[92dvh] border flex flex-col min-h-0 overflow-hidden my-auto transition-all duration-200 transform ${
        animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      } ${
        isLight 
          ? 'bg-white border-slate-200 shadow-2xl text-slate-800' 
          : 'bg-[#0A1428]/95 border-white/10 text-white shadow-2xl'
      }`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06] bg-[#0A1428]/95'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <img src="/usas-logo.png" alt="USAS Logo" className="w-7 h-7 object-contain" />
            <div className="min-w-0">
              <h3 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{t('exportPdfTitle')}</h3>
              <p className={`text-[10px] break-words ${isLight ? 'text-slate-500 font-semibold' : 'text-white/40'}`}>
                Eksport Dokumen Rasmi A4 atau Custom Wallpaper Lockscreen peranti
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-md transition-colors ${
              isLight ? 'text-slate-400 hover:text-slate-655 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div data-lenis-prevent className="p-4 flex-1 min-h-0 overflow-y-auto space-y-4 touch-pan-y overscroll-contain">
          
          {/* Main Mode Tabs */}
          <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/[0.03] border-white/[0.04]'
          }`}>
            <button
              onClick={() => setExportMode('FORMAL_A4')}
              className={`py-2 px-3 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-2 transition-all min-w-0 ${
                exportMode === 'FORMAL_A4'
                  ? (isLight ? 'bg-[#0B1E43] text-white shadow-md' : 'bg-amber-400 text-slate-950 shadow-md')
                  : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/40 hover:text-white')
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span className="truncate">Dokumen Rasmi (Formal A4)</span>
            </button>

            <button
              onClick={() => setExportMode('WALLPAPER')}
              className={`py-2 px-3 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-2 transition-all min-w-0 ${
                exportMode === 'WALLPAPER'
                  ? (isLight ? 'bg-[#0B1E43] text-white shadow-md' : 'bg-amber-400 text-slate-950 shadow-md')
                  : (isLight ? 'text-slate-500 hover:text-slate-800' : 'text-white/40 hover:text-white')
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="truncate">Wallpaper Lockscreen (Custom)</span>
            </button>
          </div>

          {exportMode !== 'WALLPAPER' && (
            <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-[11px] font-medium transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.02] border-white/[0.04] text-white/70'
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                isLight ? 'text-amber-800' : 'text-amber-400/90'
              }`}>Format Muat Turun:</span>
              <div className="flex flex-wrap items-center gap-1">
                {fileTypeOptions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setExportFileType(item.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-all min-w-0 ${
                      exportFileType === item.id
                        ? (isLight ? 'bg-[#0B1E43] text-white border-slate-800 shadow-sm' : 'bg-amber-400 text-slate-950 border-amber-400')
                        : (isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100/50' : 'bg-white/[0.02] border-white/10 text-white/50')
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MINIMALIST CUSTOMIZERS (Horizontal Segmented Controls for Height Reduction) */}
          {exportMode !== 'FORMAL_A4' && (
            <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between text-[11px] font-medium transition-colors relative ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.02] border-white/[0.04] text-white/70'
            }`}>
              
              {/* Invisible overlay to close dropdowns on clicking outside */}
              {(ratioDropdownOpen || detailDropdownOpen || themeDropdownOpen) && (
                <div 
                  className="fixed inset-0 z-10 cursor-default" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setRatioDropdownOpen(false);
                    setDetailDropdownOpen(false);
                    setThemeDropdownOpen(false);
                  }}
                />
              )}

              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full justify-between sm:justify-start relative z-40">
                {/* 1. Device Ratio Selector (WALLPAPER only) */}
                {exportMode === 'WALLPAPER' && (
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start relative z-40 min-w-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                      isLight ? 'text-amber-800' : 'text-amber-400/90'
                    }`}>{t('deviceRatio')}:</span>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRatioDropdownOpen(!ratioDropdownOpen);
                          setDetailDropdownOpen(false);
                          setThemeDropdownOpen(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all shadow-sm ${
                          isLight 
                            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' 
                            : 'bg-white/[0.04] border-white/10 text-white/90 hover:bg-white/[0.08]'
                        }`}
                      >
                        <span>
                          {wallpaperPreset === 'phone' && `${t('phonePreset')} (9:16)`}
                          {wallpaperPreset === 'tablet' && `${t('tabletPreset')} (4:3)`}
                          {wallpaperPreset === 'desktop' && `${t('desktopPreset')} (16:9)`}
                          {wallpaperPreset === 'square' && `${t('squarePreset')} (1:1)`}
                        </span>
                        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${ratioDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {ratioDropdownOpen && (
                        <div className={`absolute top-full mt-1 left-0 w-44 rounded-xl border shadow-xl py-1 z-30 transition-all ${
                          isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0A1428] border-white/10 text-white'
                        }`}>
                          {ratioOptions.map((item) => (
                            <button
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setWallpaperPreset(item.id);
                                setRatioDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors flex items-center justify-between ${
                                wallpaperPreset === item.id 
                                  ? (isLight ? 'text-amber-800 bg-amber-50/50' : 'text-amber-400 bg-amber-400/5') 
                                  : ''
                              }`}
                            >
                              <span>{item.label}</span>
                              {wallpaperPreset === item.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Content Detail Selector */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start relative z-20 min-w-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                    isLight ? 'text-amber-800' : 'text-amber-400/90'
                  }`}>{t('cardContent')}:</span>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailDropdownOpen(!detailDropdownOpen);
                        setRatioDropdownOpen(false);
                        setThemeDropdownOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all shadow-sm ${
                        isLight 
                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' 
                          : 'bg-white/[0.04] border-white/10 text-white/90 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>
                        {contentDetail === 'CODE' && t('codeOnly')}
                        {contentDetail === 'DETAILS' && t('details')}
                      </span>
                      <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${detailDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {detailDropdownOpen && (
                      <div className={`absolute top-full mt-1 right-0 w-36 rounded-xl border shadow-xl py-1 z-30 transition-all ${
                        isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0A1428] border-white/10 text-white'
                      }`}>
                        {detailOptions.map((item) => (
                          <button
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setContentDetail(item.id);
                              setDetailDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors flex items-center justify-between ${
                              contentDetail === item.id 
                                ? (isLight ? 'text-amber-800 bg-amber-50/50' : 'text-amber-400 bg-amber-400/5') 
                                : ''
                            }`}
                          >
                            <span>{item.label}</span>
                            {contentDetail === item.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Tema Jadual Selector */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start relative z-20 min-w-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                    isLight ? 'text-amber-800' : 'text-amber-400/90'
                  }`}>{t('tableTheme')}:</span>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setThemeDropdownOpen(!themeDropdownOpen);
                        setRatioDropdownOpen(false);
                        setDetailDropdownOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all shadow-sm ${
                        isLight 
                          ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' 
                          : 'bg-white/[0.04] border-white/10 text-white/90 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>
                        {exportTheme === 'light' ? t('themeLight') : t('themeDark')}
                      </span>
                      <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${themeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {themeDropdownOpen && (
                      <div className={`absolute top-full mt-1 right-0 w-36 rounded-xl border shadow-xl py-1 z-30 transition-all ${
                        isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#0A1428] border-white/10 text-white'
                      }`}>
                        {themeOptions.map((item) => (
                          <button
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExportTheme(item.id);
                              setThemeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors flex items-center justify-between ${
                              exportTheme === item.id 
                                ? (isLight ? 'text-amber-800 bg-amber-50/50' : 'text-amber-400 bg-amber-400/5') 
                                : ''
                            }`}
                          >
                            <span>{item.label}</span>
                            {exportTheme === item.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {exportMode === 'WALLPAPER' && (
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start relative z-20">
                    <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                      isLight ? 'text-amber-800' : 'text-amber-400/90'
                    }`}>Posisi:</span>
                    <div className={`flex items-center gap-2 rounded-lg border px-2 py-1 ${
                      isLight
                        ? 'bg-white border-slate-200'
                        : 'bg-white/[0.04] border-white/10'
                    }`}>
                      <input
                        type="range"
                        min={-48}
                        max={48}
                        step={1}
                        value={wallpaperYOffset}
                        onChange={(e) => setWallpaperYOffset(Number(e.target.value))}
                        className={`usas-range w-24 cursor-pointer ${isLight ? '' : 'usas-range-dark'}`}
                        aria-label="Laraskan posisi jadual pada lockscreen"
                      />
                      <span className={`w-9 text-right text-[10px] font-semibold tabular-nums ${
                        isLight ? 'text-slate-500' : 'text-white/55'
                      }`}>
                        {currentSpacers.offset > 0 ? '+' : ''}{currentSpacers.offset}
                      </span>
                      {wallpaperYOffset !== 0 && (
                        <button
                          type="button"
                          onClick={() => setWallpaperYOffset(0)}
                          className={`rounded p-0.5 transition-colors ${
                            isLight
                              ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                              : 'text-white/40 hover:bg-white/[0.08] hover:text-white/80'
                          }`}
                          aria-label="Reset posisi lockscreen"
                          title="Reset posisi"
                        >
                          <RotateCw className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* â”€â”€ MODE 1: FORMAL PRINTABLE A4 DOCUMENT â”€â”€ */}
          {exportMode === 'FORMAL_A4' && (
            <div
              ref={previewShellRef}
              data-lenis-prevent
            className={`border rounded-xl p-2 sm:p-3 bg-white overflow-visible relative ${isLight ? 'border-slate-200 shadow-sm' : 'border-white/10 shadow-inner'}`}
              style={{ 
                height: previewHeight ? `${Math.ceil(previewHeight * finalScale) + 48}px` : 'auto',
                maxHeight: 'none'
              }}
            >
              <div className="absolute inset-0 pointer-events-none z-30">
                {renderFloatingZoomWidget(true)}
              </div>
              <div 
                style={{ 
                  width: `${840 * finalScale}px`, 
                  height: `${previewHeight * finalScale}px`,
                  position: 'relative',
                  overflow: 'hidden',
                  margin: '0 auto'
                }}
              >
                <div
                  ref={pdfRef}
                  data-export-root="formal-a4-export-root"
                  className="bg-white text-slate-950 p-4 sm:p-6 rounded-lg text-xs shadow-inner border border-slate-300 w-[840px] max-w-none absolute top-0 left-0"
                  style={{
                    transform: `scale(${finalScale})`,
                    transformOrigin: 'top left',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                >
                  {/* Official Branding Header */}
                  <div className="border-b-2 border-slate-900 pb-2 mb-3 flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <img src="/usas-logo.png" alt="USAS Crest" className="w-10 h-10 object-contain" />
                      <div>
                        <h1 className="text-xs font-black tracking-tight text-slate-900 uppercase leading-none">
                          UNIVERSITI SULTAN AZLAN SHAH (USAS)
                        </h1>
                        <h2 className="text-[10px] font-bold text-amber-805 uppercase mt-1 leading-none">
                          JADUAL WAKTU KULIAH PELAJAR
                        </h2>
                        <p className="text-[9px] text-slate-500 font-semibold mt-1 leading-none">
                          {semesterStr}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[9px] text-slate-500 font-semibold leading-tight">
                      <div>Format: A4 LANDSCAPE</div>
                      <div className="text-amber-800 font-bold">DOKUMEN RASMI</div>
                    </div>
                  </div>

                  {/* Student Identity Block */}
                  <div className="bg-slate-50 p-2 rounded border border-slate-200 mb-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[9.5px]">
                    <div>
                      <span className="font-bold text-slate-600">NAMA PELAJAR:</span> <span className="font-extrabold text-slate-900">{studentName}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-600">NO. MATRIK:</span> <span className="font-extrabold text-slate-900">{matricNo}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-600">PROGRAM:</span> <span className="font-extrabold text-slate-900">{programName}</span>
                    </div>
                  </div>

                  <table className="w-full table-fixed border-collapse border border-slate-400 text-[10px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold" style={{ height: '32px' }}>
                        <th className="border border-slate-400 px-2 py-1.5 text-center align-middle w-20">
                          <span>{lang === 'en' ? 'DAY' : 'HARI'}</span>
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center align-middle w-28">
                          <span>{lang === 'en' ? 'TIME' : 'WAKTU'}</span>
                        </th>
                        <th className="border border-slate-400 px-2.5 py-1.5 text-left align-middle w-24">
                          <span>{lang === 'en' ? 'CODE' : 'KOD'}</span>
                        </th>
                        <th className="border border-slate-400 px-2.5 py-1.5 text-left align-middle">
                          <span>{lang === 'en' ? 'COURSE NAME' : 'NAMA KURSUS'}</span>
                        </th>
                        <th className="border border-slate-400 px-2 py-1.5 text-center align-middle w-16">
                          <span>{lang === 'en' ? 'GROUP' : 'GROUP'}</span>
                        </th>
                        <th className="border border-slate-400 px-2.5 py-1.5 text-left align-middle w-36">
                          <span>{lang === 'en' ? 'LOCATION' : 'LOKASI'}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCourses.map((c, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} style={{ height: '30px' }}>
                          <td className="border border-slate-300 px-2 py-1 text-center align-middle font-bold text-amber-805">
                            <span>{t(`days.${c.day?.toUpperCase()}`) || c.day}</span>
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center align-middle font-medium">
                            <span>{formatDurationRange(c.start_time || c.jadual, c.end_time)}</span>
                          </td>
                          <td className="border border-slate-300 px-2.5 py-1 text-left align-middle font-bold text-blue-900">
                            <span>{c.course_id || c.kod_kursus}</span>
                          </td>
                          <td className="border border-slate-300 px-2.5 py-1 text-left align-middle font-semibold text-slate-900">
                            <span>{c.course_name || c.kursus}</span>
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center align-middle font-bold">
                            <span>{normalizeGroup(c.group || c.kumpulan || 'A')}</span>
                          </td>
                          <td className="border border-slate-300 px-2.5 py-1 text-left align-middle text-slate-800">
                            <span>{c.location || 'Dewan USAS'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Relocated Date & Time Footer */}
                  <div className="mt-3 pt-1.5 border-t border-slate-200 text-[8px] text-slate-500 flex flex-wrap justify-between items-center font-medium gap-x-3 gap-y-1">
                    <span>{lang === 'en' ? 'Generated by STEM USAS.' : 'Dijana oleh STEM USAS.'}</span>
                    <span>{lang === 'en' ? 'Printed Date' : 'Tarikh Cetakan'}: {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'ms-MY')} {new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'ms-MY', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* â”€â”€ MODE 3: DEVICE LOCK SCREEN WALLPAPER (Custom Presets & Content Controls) â”€â”€ */}
          {exportMode === 'WALLPAPER' && (
            <div className="space-y-3">
              <div data-lenis-prevent className={`flex justify-center py-3 rounded-xl border overflow-visible relative ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#060D1A] border-white/[0.04]'
              }`}>
                <div className="absolute inset-0 pointer-events-none z-30">
                {renderFloatingZoomWidget(isLight)}
                </div>
                {(() => {
                  const widthMap = { phone: 360, tablet: 520, square: 480, desktop: 780 };
                  const heightMap = { phone: 640, tablet: 640, square: 480, desktop: 480 };
                  const w = widthMap[wallpaperPreset];
                  const h = heightMap[wallpaperPreset];
                  return (
                    <div 
                      style={{ 
                        width: `${w * userZoom}px`, 
                        height: `${h * userZoom}px`,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        ref={wallpaperRef}
                        data-export-root="wallpaper-export-root"
                        className="font-sans flex flex-col justify-start gap-2 select-none border absolute top-0 left-0 origin-top-left"
                        style={{
                          width: `${w}px`,
                          height: `${h}px`,
                          transform: `scale(${userZoom})`,
                          fontFamily: 'Inter, system-ui, sans-serif',
                          padding: wallpaperPreset === 'phone' ? '12px' : wallpaperPreset === 'square' ? '14px' : '16px',
                          backgroundColor: isExportLight ? '#FFFFFF' : '#070F22',
                          borderColor: isExportLight ? '#E2E8F0' : '#ffffff10',
                          color: isExportLight ? '#1E293B' : '#FFFFFF'
                        }}
                      >
                  {/* Top Reserved Clock Area (Removed text labels) */}
                  <div style={{ height: `${currentSpacers.top}px` }} className="flex-shrink-0" />

                  {/* Lock Screen Matrix Grid */}
                  <div className={`border p-0 flex-1 min-h-0 flex flex-col justify-start overflow-hidden ${
                    isExportLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A1428] border-white/[0.08]'
                  }`}>
                    {/* (Top Header Brand Row Removed per Request) */}

                    {/* DYNAMIC SCALING WALLPAPER GRID VIEW TABLE (Supports Phone and Square ratio scaling) */}
                    {(() => {
                      const style = getPresetStyle(wallpaperPreset, contentDetail);
                      const rowHeightPx = wallpaperPreset === 'phone'
                        ? 46
                        : wallpaperPreset === 'square'
                          ? 42
                          : wallpaperPreset === 'tablet'
                            ? 54
                            : 44;

                      // Calculate the exact available width inside the padded and bordered grid container
                      const wallpaperPadding = wallpaperPreset === 'phone' ? 12 : wallpaperPreset === 'square' ? 14 : 16;
                      const gridInnerWidth = w - (wallpaperPadding * 2) - 2; // Subtracting 2px for grid borders
                      const colWidth = (gridInnerWidth - 48) / 9; // Subtracting 48px for the day column

                      return (
                        <table className={`w-full h-full table-fixed border-collapse ${style.tableFontSize}`}>
                          <colgroup>
                            <col style={{ width: '48px' }} />
                            {WALLPAPER_HOUR_STARTS.map((hourStart) => (
                              <col key={hourStart} style={{ width: `${colWidth}px` }} />
                            ))}
                          </colgroup>
                          <thead>
                            {(() => {
                              const headerHeightPx = wallpaperPreset === 'phone' ? 14 : wallpaperPreset === 'square' ? 16 : wallpaperPreset === 'tablet' ? 20 : 18;
                              return (
                                <tr style={{ height: `${headerHeightPx}px` }}>
                                  <th 
                                    className={`p-0 font-black uppercase tracking-wider border-r ${
                                      isExportLight ? 'text-slate-500 border-slate-200' : 'text-amber-400/80 border-white/[0.06]'
                                    }`}
                                    style={{ height: `${headerHeightPx}px` }}
                                  >
                                    <div className="w-full flex items-center justify-center text-center" style={{ height: `${headerHeightPx}px` }}>
                                      <span>&nbsp;</span>
                                    </div>
                                  </th>
                                  {WALLPAPER_HOUR_STARTS.map((hourStart) => {
                                    return (
                                      <th 
                                        key={hourStart} 
                                        className={`p-0 font-black uppercase tracking-wider border-r ${
                                          isExportLight ? 'text-slate-700 border-slate-200' : 'text-white border-white/[0.06]'
                                        }`}
                                        style={{ height: `${headerHeightPx}px` }}
                                      >
                                        <div className="w-full flex items-center justify-center text-center" style={{ height: `${headerHeightPx}px` }}>
                                          <span>{formatWallpaperSlotLabel(hourStart)}</span>
                                        </div>
                                      </th>
                                    );
                                  })}
                                </tr>
                              );
                            })()}
                          </thead>
                          <tbody>
                            {daysList.map((d) => {
                              const dayColor = getModalDayColors(d, isExportLight);
                              return (
                              <tr key={d} style={{ height: `${rowHeightPx}px` }} className={`border-t ${isExportLight ? 'border-slate-200/60' : 'border-white/[0.04]'}`}>
                                <td 
                                  className={`p-0 font-bold border-r ${
                                    isExportLight ? 'text-slate-450 border-slate-200' : 'text-white/40 border-white/[0.06]'
                                  } ${dayColor.text}`}
                                  style={{ height: `${rowHeightPx}px` }}
                                >
                                  <div className="w-full flex items-center justify-center text-center" style={{ height: `${rowHeightPx}px` }}>
                                    <span>{t(`shortDays.${d?.toUpperCase()}`) || d}</span>
                                  </div>
                                </td>
                                {WALLPAPER_HOUR_STARTS.map((hourStart) => {
                                  const course = getWallpaperCourseForHour(d, hourStart);
                                  const covered = isWallpaperSlotCovered(d, hourStart);
                                  if (covered) return null;
                                  if (course) {
                                    const courseSpan = getWallpaperCourseSpan(course);
                                    return (
                                      <td 
                                        key={hourStart} 
                                        colSpan={courseSpan} 
                                        className={`border-r align-middle p-0.5 overflow-visible ${
                                          isExportLight ? 'border-slate-200/60' : 'border-white/[0.04]'
                                        } ${dayColor.bg} ${dayColor.border}`}
                                        style={{ height: `${rowHeightPx}px` }}
                                      >
                                        {renderWallpaperCourseContent(course, courseSpan, rowHeightPx, isExportLight, style)}
                                      </td>
                                    );
                                  }
                                  return (
                                    <td key={hourStart} className={`border-r border-white/[0.04] align-middle p-0 ${
                                      isExportLight ? 'border-slate-200/60' : 'border-white/[0.04]'
                                    }`} />
                                  );
                                })}
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>

                  <div style={{ height: `${currentSpacers.bottom}px` }} className="flex-shrink-0" />
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    )}

        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-end gap-2 flex-shrink-0 ${
          isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06] bg-[#0A1428]/95'
        }`}>
          <button
            onClick={onClose}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
              isLight 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border-white/10'
            }`}
          >
            {t('cancel')}
          </button>

          <button
            onClick={handleDownload}
            disabled={exporting}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all ${
              isLight 
                ? 'bg-[#0B1E43] hover:bg-[#152e63] text-white shadow-slate-900/10' 
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/10'
            }`}
          >
            {exporting ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>{lang === 'en' ? 'Generating...' : 'Menjana...'}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>
                  {exportMode === 'WALLPAPER'
                    ? (lang === 'en' ? 'Download PNG' : 'Muat Turun PNG')
                    : (lang === 'en' ? 'Download PDF' : 'Muat Turun PDF')}
                </span>
              </>
            )}
          </button>
        </div>

      </div>

      {exporting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md rounded-3xl overflow-hidden">
          <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 text-center max-w-xs w-full shadow-2xl transition-all duration-300 ${
            isLight 
              ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10' 
              : 'bg-[#0A1428]/95 border-white/10 text-white shadow-black/40'
          }`}>
            {/* Circular Gauge Meter */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Circular SVG Gauge */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className={isLight ? 'stroke-slate-100' : 'stroke-white/[0.04]'}
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-amber-500 transition-all duration-300 ease-out"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 - (progress / 100) * (2 * Math.PI * 34)}
                  strokeLinecap="round"
                />
              </svg>
              {/* Center percentage counter */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-lg font-black tracking-tight">{progress}%</span>
              </div>
            </div>

            {/* Gauge Info Text */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                {lang === 'en' ? 'Exporting File' : 'Mengeksport Fail'}
              </h3>
              <p className="text-[11px] font-medium opacity-80 min-h-[32px] flex items-center justify-center px-2">
                {progressStatus}
              </p>
            </div>
            
            {/* Simulated bar loader for secondary visual hint */}
            <div className={`w-full h-1 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-white/[0.04]'}`}>
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}






