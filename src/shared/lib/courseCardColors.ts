import type { CourseColorSlot } from './courseColors';
import { getOwnRecordValue } from './security';

// Shared card palette so TimetableGrid and the compare modal paint identical colours.
export type CardColorScheme = {
  dot: string;
  text: string;
  accent: string;
  bg: string;
  border: string;
  badge: string;
};

export const CARD_DARK_COLORS: Record<string, CardColorScheme> = {
  emerald: { dot: 'bg-emerald-400', text: 'text-emerald-400 font-bold', accent: 'border-l-emerald-400', bg: 'bg-emerald-500/[0.18]', border: 'border-emerald-500/40', badge: 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold' },
  blue:    { dot: 'bg-blue-400',    text: 'text-blue-400 font-bold',    accent: 'border-l-blue-400',    bg: 'bg-blue-500/[0.18]',    border: 'border-blue-500/40',    badge: 'bg-blue-500/30 text-blue-300 border border-blue-500/50 font-bold' },
  amber:   { dot: 'bg-amber-400',   text: 'text-amber-400 font-bold',   accent: 'border-l-amber-400',   bg: 'bg-amber-500/[0.18]',   border: 'border-amber-500/40',   badge: 'bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold' },
  purple:  { dot: 'bg-purple-400',  text: 'text-purple-400 font-bold',  accent: 'border-l-purple-400',  bg: 'bg-purple-500/[0.18]',  border: 'border-purple-500/40',  badge: 'bg-purple-500/30 text-purple-300 border border-purple-500/50 font-bold' },
  rose:    { dot: 'bg-rose-400',    text: 'text-rose-400 font-bold',    accent: 'border-l-rose-400',    bg: 'bg-rose-500/[0.18]',    border: 'border-rose-500/40',    badge: 'bg-rose-500/30 text-rose-300 border border-rose-500/50 font-bold' },
  orange:  { dot: 'bg-orange-400',  text: 'text-orange-400 font-bold',  accent: 'border-l-orange-400',  bg: 'bg-orange-500/[0.18]',  border: 'border-orange-500/40',  badge: 'bg-orange-500/30 text-orange-300 border border-orange-500/50 font-bold' },
  slate:   { dot: 'bg-slate-400',   text: 'text-slate-400 font-bold',   accent: 'border-l-slate-400',   bg: 'bg-slate-500/[0.18]',   border: 'border-slate-500/40',   badge: 'bg-slate-500/30 text-slate-300 border border-slate-500/50 font-bold' },
  teal:    { dot: 'bg-teal-400',    text: 'text-teal-400 font-bold',    accent: 'border-l-teal-400',    bg: 'bg-teal-500/[0.18]',    border: 'border-teal-500/40',    badge: 'bg-teal-500/30 text-teal-300 border border-teal-500/50 font-bold' },
  indigo:  { dot: 'bg-indigo-400',  text: 'text-indigo-400 font-bold',  accent: 'border-l-indigo-400',  bg: 'bg-indigo-500/[0.18]',  border: 'border-indigo-500/40',  badge: 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 font-bold' },
  cyan:    { dot: 'bg-cyan-400',    text: 'text-cyan-400 font-bold',    accent: 'border-l-cyan-400',    bg: 'bg-cyan-500/[0.18]',    border: 'border-cyan-500/40',    badge: 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold' },
  fuchsia: { dot: 'bg-fuchsia-400', text: 'text-fuchsia-400 font-bold', accent: 'border-l-fuchsia-400', bg: 'bg-fuchsia-500/[0.18]', border: 'border-fuchsia-500/40', badge: 'bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/50 font-bold' },
  lime:    { dot: 'bg-lime-400',    text: 'text-lime-400 font-bold',    accent: 'border-l-lime-400',    bg: 'bg-lime-500/[0.18]',    border: 'border-lime-500/40',    badge: 'bg-lime-500/30 text-lime-300 border border-lime-500/50 font-bold' },
};

export const CARD_LIGHT_COLORS: Record<string, CardColorScheme> = {
  emerald: { dot: 'bg-emerald-500', text: 'text-emerald-800 font-bold', accent: 'border-l-emerald-500', bg: 'bg-emerald-100/70', border: 'border-emerald-300/80', badge: 'bg-emerald-600 text-white font-extrabold shadow-sm' },
  blue:    { dot: 'bg-blue-500',    text: 'text-blue-800 font-bold',    accent: 'border-l-blue-500',    bg: 'bg-blue-100/70',    border: 'border-blue-300/80',    badge: 'bg-blue-600 text-white font-extrabold shadow-sm' },
  amber:   { dot: 'bg-amber-500',   text: 'text-amber-800 font-bold',   accent: 'border-l-amber-500',   bg: 'bg-amber-100/80',   border: 'border-amber-300/85',   badge: 'bg-amber-600 text-white font-extrabold shadow-sm' },
  purple:  { dot: 'bg-purple-500',  text: 'text-purple-800 font-bold',  accent: 'border-l-purple-500',  bg: 'bg-purple-100/70',  border: 'border-purple-300/80',  badge: 'bg-purple-600 text-white font-extrabold shadow-sm' },
  rose:    { dot: 'bg-rose-500',    text: 'text-rose-800 font-bold',    accent: 'border-l-rose-500',    bg: 'bg-rose-100/70',    border: 'border-rose-300/80',    badge: 'bg-rose-600 text-white font-extrabold shadow-sm' },
  orange:  { dot: 'bg-orange-500',  text: 'text-orange-800 font-bold',  accent: 'border-l-orange-500',  bg: 'bg-orange-100/70',  border: 'border-orange-300/80',  badge: 'bg-orange-600 text-white font-extrabold shadow-sm' },
  slate:   { dot: 'bg-slate-500',   text: 'text-slate-800 font-bold',   accent: 'border-l-slate-500',   bg: 'bg-slate-200/70',   border: 'border-slate-300/80',   badge: 'bg-slate-600 text-white font-extrabold shadow-sm' },
  teal:    { dot: 'bg-teal-500',    text: 'text-teal-800 font-bold',    accent: 'border-l-teal-500',    bg: 'bg-teal-100/70',    border: 'border-teal-300/80',    badge: 'bg-teal-600 text-white font-extrabold shadow-sm' },
  indigo:  { dot: 'bg-indigo-500',  text: 'text-indigo-800 font-bold',  accent: 'border-l-indigo-500',  bg: 'bg-indigo-100/70',  border: 'border-indigo-300/80',  badge: 'bg-indigo-600 text-white font-extrabold shadow-sm' },
  cyan:    { dot: 'bg-cyan-500',    text: 'text-cyan-800 font-bold',    accent: 'border-l-cyan-500',    bg: 'bg-cyan-100/70',    border: 'border-cyan-300/80',    badge: 'bg-cyan-600 text-white font-extrabold shadow-sm' },
  fuchsia: { dot: 'bg-fuchsia-500', text: 'text-fuchsia-800 font-bold', accent: 'border-l-fuchsia-500', bg: 'bg-fuchsia-100/70', border: 'border-fuchsia-300/80', badge: 'bg-fuchsia-600 text-white font-extrabold shadow-sm' },
  lime:    { dot: 'bg-lime-500',    text: 'text-lime-800 font-bold',    accent: 'border-l-lime-500',    bg: 'bg-lime-100/70',    border: 'border-lime-300/80',    badge: 'bg-lime-600 text-white font-extrabold shadow-sm' },
};

export const DAY_COLOR_KEY: Record<string, string> = {
  ISNIN: 'emerald', SELASA: 'blue', RABU: 'amber', KHAMIS: 'purple', JUMAAT: 'rose', SABTU: 'orange', AHAD: 'slate',
};

export const getCardColorByScheme = (scheme: string, isLight: boolean): CardColorScheme => {
  const colors = isLight ? CARD_LIGHT_COLORS : CARD_DARK_COLORS;
  return getOwnRecordValue<CardColorScheme>(colors, scheme) || colors.emerald;
};

export const getCourseCardColor = (slot: CourseColorSlot | undefined, isLight: boolean): CardColorScheme => {
  const key = getOwnRecordValue<string>(DAY_COLOR_KEY, slot || '') || 'emerald';
  return getCardColorByScheme(key, isLight);
};
