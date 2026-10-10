import type { TimetableItem, TimeFormat } from '@/shared/types/usas';
import { extractDayName } from '@/shared/lib/dayFormat';
import { getCourseColorSlot, type CourseColorSlot } from '@/shared/lib/courseColors';
import { formatTimeFromMinutes, parseTimeToMinutes } from '@/shared/lib/timetableTime';
import { getOwnRecordValue } from '@/shared/lib/security';
import { measureTextWidth } from '../lib/wallpaperExportHelpers';

const WEEK_DAYS = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'] as const;

type ChipColor = {
  bg: string;
  text: string;
  bar: string;
  liquidTop?: string;
  liquidBottom?: string;
  liquidBorder?: string;
};
type GlassTheme = 'light' | 'dark' | 'emerald' | 'oled' | 'warm';

const GLASS_THEMES: Record<GlassTheme, { card: string; wash: string; strong: string; muted: string; hairline: string; rim: string }> = {
  light: {
    card: 'rgba(255, 255, 255, 0.42)',
    wash: 'rgba(255, 255, 255, 0.32)',
    strong: '#FFFFFF',
    muted: 'rgba(255, 255, 255, 0.75)',
    hairline: 'rgba(255, 255, 255, 0.16)',
    rim: 'rgba(255, 255, 255, 0.20)',
  },
  dark: {
    card: 'rgba(15, 23, 42, 0.50)',
    wash: 'rgba(15, 23, 42, 0.32)',
    strong: '#FFFFFF',
    muted: 'rgba(255, 255, 255, 0.65)',
    hairline: 'rgba(255, 255, 255, 0.12)',
    rim: 'rgba(255, 255, 255, 0.18)',
  },
  emerald: {
    card: 'rgba(2, 44, 34, 0.50)',
    wash: 'rgba(2, 44, 34, 0.32)',
    strong: '#FFFFFF',
    muted: 'rgba(209, 250, 229, 0.70)',
    hairline: 'rgba(110, 231, 183, 0.15)',
    rim: 'rgba(167, 243, 208, 0.20)',
  },
  oled: {
    card: 'rgba(0, 0, 0, 0.65)',
    wash: 'rgba(0, 0, 0, 0.45)',
    strong: '#FFFFFF',
    muted: 'rgba(255, 255, 255, 0.65)',
    hairline: 'rgba(255, 255, 255, 0.15)',
    rim: 'rgba(255, 255, 255, 0.16)',
  },
  warm: {
    card: 'rgba(38, 20, 5, 0.50)',
    wash: 'rgba(38, 20, 5, 0.32)',
    strong: '#FFFFFF',
    muted: 'rgba(254, 240, 138, 0.70)',
    hairline: 'rgba(251, 191, 36, 0.15)',
    rim: 'rgba(254, 240, 138, 0.20)',
  },
};

// Plain rgba/hex values (not Tailwind classes) so the PNG renderer sees exact colours.
const DARK_CHIPS: Record<CourseColorSlot, ChipColor> = {
  ISNIN:  { bg: 'rgba(16,185,129,0.34)', text: '#A7F3D0', bar: '#10B981' },
  SELASA: { bg: 'rgba(79,70,229,0.48)',  text: '#C7D2FE', bar: '#6366F1' },
  RABU:   { bg: 'rgba(217,119,6,0.45)',  text: '#FDE68A', bar: '#F59E0B' },
  KHAMIS: { bg: 'rgba(147,51,234,0.42)', text: '#E9D5FF', bar: '#A855F7' },
  JUMAAT: { bg: 'rgba(225,29,72,0.42)',  text: '#FECDD3', bar: '#F43F5E' },
  SABTU:  { bg: 'rgba(234,88,12,0.45)',  text: '#FED7AA', bar: '#F97316' },
  AHAD:   { bg: 'rgba(100,116,139,0.5)', text: '#E2E8F0', bar: '#94A3B8' },
};

const LIGHT_CHIPS: Record<CourseColorSlot, ChipColor> = {
  ISNIN:  { bg: '#A7F3D0', text: '#064E3B', bar: '#10B981' },
  SELASA: { bg: '#C7D2FE', text: '#1E3A8A', bar: '#6366F1' },
  RABU:   { bg: '#FDE68A', text: '#78350F', bar: '#F59E0B' },
  KHAMIS: { bg: '#E9D5FF', text: '#581C87', bar: '#A855F7' },
  JUMAAT: { bg: '#FECDD3', text: '#881337', bar: '#F43F5E' },
  SABTU:  { bg: '#FED7AA', text: '#7C2D12', bar: '#F97316' },
  AHAD:   { bg: '#CBD5E1', text: '#1E293B', bar: '#64748B' },
};

// Subtle, clean tinted glass pills for Apple-style liquid glass
const LIQUID_JEWELS: Record<CourseColorSlot, { top: string; bottom: string; border: string; bar: string }> = {
  ISNIN:  { top: 'rgba(16, 185, 129, 0.30)',  bottom: 'rgba(16, 185, 129, 0.14)', border: 'rgba(110, 231, 183, 0.20)', bar: '#10B981' },
  SELASA: { top: 'rgba(79, 70, 229, 0.32)',   bottom: 'rgba(79, 70, 229, 0.16)',  border: 'rgba(165, 180, 252, 0.20)', bar: '#6366F1' },
  RABU:   { top: 'rgba(245, 158, 11, 0.32)',  bottom: 'rgba(245, 158, 11, 0.16)', border: 'rgba(253, 230, 138, 0.20)', bar: '#F59E0B' },
  KHAMIS: { top: 'rgba(168, 85, 247, 0.32)',  bottom: 'rgba(168, 85, 247, 0.16)', border: 'rgba(233, 213, 255, 0.20)', bar: '#A855F7' },
  JUMAAT: { top: 'rgba(244, 63, 94, 0.32)',   bottom: 'rgba(244, 63, 94, 0.16)',  border: 'rgba(254, 205, 211, 0.20)', bar: '#F43F5E' },
  SABTU:  { top: 'rgba(249, 115, 22, 0.32)',  bottom: 'rgba(249, 115, 22, 0.16)', border: 'rgba(254, 215, 170, 0.20)', bar: '#F97316' },
  AHAD:   { top: 'rgba(148, 163, 184, 0.30)', bottom: 'rgba(148, 163, 184, 0.14)', border: 'rgba(226, 232, 240, 0.20)', bar: '#94A3B8' },
};

const THEME_BARS: Partial<Record<GlassTheme, Record<CourseColorSlot, string>>> = {
  emerald: { ISNIN: '#10B981', SELASA: '#14B8A6', RABU: '#F59E0B', KHAMIS: '#84CC16', JUMAAT: '#059669', SABTU: '#D97706', AHAD: '#94A3B8' },
  oled: { ISNIN: '#10B981', SELASA: '#3B82F6', RABU: '#F59E0B', KHAMIS: '#A855F7', JUMAAT: '#F43F5E', SABTU: '#F97316', AHAD: '#71717A' },
  warm: { ISNIN: '#F59E0B', SELASA: '#F97316', RABU: '#EAB308', KHAMIS: '#EF4444', JUMAAT: '#D97706', SABTU: '#EA580C', AHAD: '#78716C' },
};

type MinimalWeekCardProps = {
  courses: TimetableItem[];
  courseColorMap: Map<string, CourseColorSlot>;
  isLight: boolean;
  showTimes: boolean;
  timeFormat: TimeFormat;
  title: string;
  t: (key: string) => string;
  // Offsets from the card to the wallpaper root, so the blurred copy of a
  // custom background lines up with the sharp one behind the card.
  width: number;
  // Apple-style liquid glass: light milky glass, dark text, bent edges and a bright rim.
  glass?: boolean;
  glassTheme?: GlassTheme;
  background?: { url: string; rootWidth: number; rootHeight: number; left: number; bottom: number };
};

const hexToRgba = (hex: string, alpha: number) => {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
};

const courseCode = (course: TimetableItem) => course.course_id || course.kod_kursus || '';

export default function MinimalWeekCard({
  courses,
  courseColorMap,
  isLight,
  showTimes,
  timeFormat,
  title,
  t,
  width,
  glass = false,
  glassTheme = 'light',
  background,
}: MinimalWeekCardProps) {
  const glassStyle = getOwnRecordValue<typeof GLASS_THEMES.light>(GLASS_THEMES, glassTheme) || GLASS_THEMES.light;
  const palette = isLight ? LIGHT_CHIPS : DARK_CHIPS;
  const colorFor = (code: string): ChipColor => {
    const slot = getCourseColorSlot(courseColorMap, code);
    if (glass) {
      const jewel = getOwnRecordValue<(typeof LIQUID_JEWELS)[CourseColorSlot]>(LIQUID_JEWELS, slot) || LIQUID_JEWELS.ISNIN;
      return {
        bg: jewel.bottom,
        text: '#FFFFFF',
        bar: jewel.bar,
        liquidTop: jewel.top,
        liquidBottom: jewel.bottom,
        liquidBorder: jewel.border,
      };
    }
    const themeBars = getOwnRecordValue<Record<CourseColorSlot, string>>(THEME_BARS, glassTheme);
    const bar = themeBars ? getOwnRecordValue<string>(themeBars, slot) : undefined;
    if (bar) {
      return {
        bg: hexToRgba(bar, glassTheme === 'oled' ? 0.48 : 0.3),
        text: glassTheme === 'warm' ? '#FEF3C7' : '#ECFDF5',
        bar,
      };
    }
    return getOwnRecordValue<ChipColor>(palette, slot) || palette.ISNIN;
  };

  const startOf = (course: TimetableItem) => parseTimeToMinutes(course.start_time || course.jadual || '');
  const byDay = WEEK_DAYS.map((day) => ({
    day,
    classes: courses
      .filter((course) => extractDayName(course.day) === day)
      .sort((a, b) => (startOf(a) ?? Infinity) - (startOf(b) ?? Infinity)),
  })).filter(({ classes }) => classes.length > 0);

  // Free days are left out so class days get the full card width. Text is then
  // sized to fit each chip on one line (the PNG renderer can't shrink-to-fit).
  const COLUMN_GAP = glass ? 3.5 : 4;
  const padX = glass ? 10 : 12;
  const chipWidth = (width - (glass ? 2 : 2) - padX * 2 - COLUMN_GAP * Math.max(0, byDay.length - 1)) / Math.max(1, byDay.length);
  const chipTextWidth = chipWidth - (glass ? 8 : 6);
  const fitFont = (texts: string[], max: number, charWidth: number) =>
    Math.max(4, Math.min(max, chipTextWidth / (Math.max(1, ...texts.map((text) => text.length)) * charWidth)));
  const chipDetail = (course: TimetableItem) => {
    const start = startOf(course);
    return [start !== null ? formatTimeFromMinutes(start, timeFormat) : '', course.location || ''].filter(Boolean).join(' | ');
  };
  // One size for every chip so the card reads evenly.
  const shownCourses = byDay.flatMap(({ classes }) => classes);
  const codeFontSize = fitFont(shownCourses.map(courseCode), glass ? 7.2 : 8.5, glass ? 0.82 : 0.68);
  const detailFontSize = fitFont(shownCourses.map(chipDetail), glass ? 5.6 : 6.5, glass ? 0.68 : 0.6);
  // The detail font can't shrink below the 4px floor, so when a chip is narrow
  // (e.g. many class days), trim the text instead of letting it bleed past the chip.
  const detailMaxChars = Math.max(5, Math.floor(chipTextWidth / Math.max(1, detailFontSize) / (glass ? 0.68 : 0.6)));
  const shortenDetail = (text: string) => {
    if (text.length <= detailMaxChars) return text;
    const separator = text.indexOf(' | ');
    if (separator > 0) {
      const prefix = text.slice(0, separator + 3);
      const room = text.slice(separator + 3);
      const roomMax = Math.max(1, detailMaxChars - prefix.length - 1);
      return `${prefix}${room.slice(0, roomMax).trimEnd()}…`;
    }
    return `${text.slice(0, Math.max(1, detailMaxChars - 1)).trimEnd()}…`;
  };

  const legend = Array.from(
    new Map(courses.map((course) => [courseCode(course), course.course_name || course.kursus || ''])).entries(),
  ).filter(([code]) => code);

  // The PNG renderer clips (it can't ellipsize), so trim the class name to the
  // width it can actually occupy beside the colour bar and course code instead of
  // a fixed character cap that cut names short even when the card had room.
  const LEGEND_FONT_PX = 7.5;
  const legendFont = (weight: number) => `${weight} ${LEGEND_FONT_PX}px Inter, Arial, sans-serif`;
  const fitLegendName = (code: string, name: string) => {
    const lower = name.toLowerCase();
    const fallbackCharWidth = LEGEND_FONT_PX * 0.52;
    const widthOf = (text: string) => measureTextWidth(text, legendFont(400)) ?? text.length * fallbackCharWidth;
    const barWidth = widthOf('\u258E') + 5;
    const codeWidth = measureTextWidth(code, legendFont(800)) ?? code.length * LEGEND_FONT_PX * 0.62;
    const separatorWidth = widthOf(' \u00b7 ');
    // `textTransform: capitalize` widens word initials slightly; keep a 2% margin.
    const budget = (width - padX * 2 - barWidth - codeWidth - separatorWidth) * 0.98;
    if (budget <= 0) return '';
    if (widthOf(lower) <= budget) return lower;
    const ellipsis = '\u2026';
    const ellipsisWidth = widthOf(ellipsis);
    let lo = 0;
    let hi = lower.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (widthOf(lower.slice(0, mid)) + ellipsisWidth <= budget) lo = mid; else hi = mid - 1;
    }
    return `${lower.slice(0, lo).trimEnd()}${ellipsis}`;
  };

  const muted = glass ? glassStyle.muted : isLight ? '#475569' : 'rgba(255,255,255,0.45)';
  const strong = glass ? glassStyle.strong : isLight ? '#0F172A' : 'rgba(255,255,255,0.92)';
  const hairline = glass ? glassStyle.hairline : isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.07)';
  const radius = glass ? '24px' : '18px';
  return (
    <div
      data-wallpaper-minimal-card
      data-wallpaper-glass-theme={glass ? glassTheme : undefined}
      className="relative z-10 overflow-hidden"
      style={{
        borderRadius: radius,
        ...(glass
          ? {
              border: `1px solid ${glassStyle.rim}`,
              // html2canvas mis-renders `inset` box-shadow layers (fills the card
              // with a grey wash and draws a dark offset rectangle in the export),
              // so the top-edge highlight lives on the sheen overlay instead.
              boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.35)',
              backgroundColor: glassStyle.card,
            }
          : {
              border: `1px solid ${isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)'}`,
              backgroundColor: background
                ? (isLight ? 'rgba(255,255,255,0.55)' : 'rgba(18,18,22,0.55)')
                : (isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.05)'),
            }),
        isolation: 'isolate',
      }}
    >
      {background && (
        <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden" style={{ borderRadius: radius }}>
          <div
            data-wallpaper-background-blur
            className="absolute max-w-none"
            style={{
              width: `${background.rootWidth}px`,
              height: `${background.rootHeight}px`,
              left: `${-background.left}px`,
              bottom: `${-background.bottom}px`,
              backgroundImage: `url("${background.url}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: glass ? glassStyle.wash : isLight ? 'rgba(255,255,255,0.45)' : 'rgba(10,10,14,0.5)' }} />
        </div>
      )}
      {glass && (
        /* Subtle Apple-style top-edge glass light */
        <div
          aria-hidden="true"
          data-wallpaper-glass-sheen
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            borderRadius: radius,
            backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 100%)',
          }}
        />
      )}
      <div className="relative z-10" style={{ padding: glass ? `16px ${padX}px 14px` : `14px ${padX}px 12px` }}>
        <div data-wallpaper-minimal-text style={{ fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted }}>
          {title}
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${byDay.length}, minmax(0, 1fr))`,
            marginTop: '9px',
            columnGap: `${COLUMN_GAP}px`,
          }}
        >
          {byDay.map(({ day, classes }) => (
            <div key={day} className="flex flex-col items-center" style={{ gap: glass ? '3.5px' : '3px', minWidth: 0 }}>
              <div
                data-wallpaper-minimal-text
                style={{
                  fontSize: '7px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: strong,
                  marginBottom: '2px',
                }}
              >
                {t(`shortDays.${day}`)}
              </div>
              {classes.map((course) => {
                const code = courseCode(course);
                const color = colorFor(code);
                const start = startOf(course);
                const detail = chipDetail(course);
                const isSingleLine = !showTimes || !detail;
                return (
                  <div
                    key={`${code}-${start}`}
                    data-export-course-color-code={code}
                    className="w-full text-center relative overflow-hidden"
                    style={{
                      borderRadius: glass ? (isSingleLine ? '9999px' : '10px') : '6px',
                      padding: glass ? (isSingleLine ? '4px 2px' : '3.5px 1.5px 4px') : '4px 2px 5.5px',
                      lineHeight: 1.25,
                      backgroundColor: color.bg,
                      color: glass ? '#FFFFFF' : color.text,
                      ...(glass
                        ? {
                            border: `1px solid ${color.liquidBorder || 'rgba(255, 255, 255, 0.35)'}`,
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                            backgroundImage: `linear-gradient(180deg, ${color.liquidTop || 'rgba(255,255,255,0.18)'} 0%, ${color.liquidBottom || 'rgba(255,255,255,0.06)'} 100%)`,
                          }
                        : {}),
                    }}
                  >
                    <div
                      data-wallpaper-minimal-text
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        fontSize: `${codeFontSize}px`,
                        fontWeight: 800,
                        letterSpacing: glass ? '-0.02em' : '0.01em',
                        whiteSpace: 'nowrap',
                        color: glass ? '#FFFFFF' : color.text,
                        textShadow: glass ? '0 1px 2px rgba(0, 0, 0, 0.35)' : undefined,
                      }}
                    >
                      {code}
                    </div>

                    {showTimes && detail && (
                      <div
                        data-minimal-chip-detail
                        data-wallpaper-minimal-text
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          fontSize: `${detailFontSize}px`,
                          fontWeight: 600,
                          opacity: glass ? 0.88 : 0.85,
                          marginTop: '1.5px',
                          whiteSpace: 'nowrap',
                          color: glass ? 'rgba(255, 255, 255, 0.88)' : undefined,
                          textShadow: glass ? '0 1px 2px rgba(0, 0, 0, 0.3)' : undefined,
                        }}
                      >
                        {shortenDetail(detail)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {legend.length > 0 && (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${hairline}`, display: 'grid', rowGap: '4px' }}>
            {legend.map(([code, name]) => (
              <div key={code} data-wallpaper-minimal-text style={{ fontSize: '7.5px', lineHeight: 1.4, minWidth: 0, whiteSpace: 'nowrap' }}>
                <span aria-hidden="true" style={{ color: colorFor(code).bar, marginRight: '5px' }}>{'\u258E'}</span>
                <span style={{ fontWeight: 800, color: strong }}>{code}</span>{' '}
                <span style={{ color: muted, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                  · {fitLegendName(code, name)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


