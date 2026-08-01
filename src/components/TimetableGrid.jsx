import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LiveNextClassWidget from './LiveNextClassWidget';
import AttendanceMeter from './AttendanceMeter';
import LecturerModal from './LecturerModal';
import MatrixGridView from './MatrixGridView';
import AttendanceHistoryModal from './AttendanceHistoryModal';
import ScheduleClashDetector from './ScheduleClashDetector';
import { 
  Clock, MapPin, User, BookOpen, Search, 
  GraduationCap, StickyNote, Edit3, Save,
  Grid, LayoutList, CalendarCheck, Zap,
  CalendarOff, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

// Day color system
const DAY_COLORS = {
  'ISNIN':  { dot: 'bg-emerald-400', text: 'text-emerald-400', accent: 'border-l-emerald-400' },
  'SELASA': { dot: 'bg-blue-400',    text: 'text-blue-400',    accent: 'border-l-blue-400' },
  'RABU':   { dot: 'bg-amber-400',   text: 'text-amber-400',   accent: 'border-l-amber-400' },
  'KHAMIS': { dot: 'bg-purple-400',  text: 'text-purple-400',  accent: 'border-l-purple-400' },
  'JUMAAT': { dot: 'bg-red-400',     text: 'text-red-400',     accent: 'border-l-red-400' },
  'SABTU':  { dot: 'bg-orange-400',  text: 'text-orange-400',  accent: 'border-l-orange-400' },
  'AHAD':   { dot: 'bg-slate-400',   text: 'text-slate-400',   accent: 'border-l-slate-400' },
};

export default function TimetableGrid() {
  const { timetableData, session, refreshTimetable, loading } = useAuth();
  const { lang, t } = useLanguage();
  
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [expandedCards, setExpandedCards] = useState({});
  const [expandAll, setExpandAll] = useState(false);
  const [showClashPanel, setShowClashPanel] = useState(false);
  
  // Modals
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [selectedAttendanceCourse, setSelectedAttendanceCourse] = useState(null);

  // Notes
  const [courseNotes, setCourseNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usas_course_notes') || '{}'); } catch (e) { return {}; }
  });
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [noteInput, setNoteInput] = useState('');

  const daysList = timetableData?.days || ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];
  const allCourses = timetableData?.timetable || [];

  const handleSaveNote = (courseId) => {
    const updated = { ...courseNotes, [courseId]: noteInput };
    setCourseNotes(updated);
    try { localStorage.setItem('usas_course_notes', JSON.stringify(updated)); } catch (e) {}
    setEditingCourseId(null);
  };

  // Detect clashes
  const hasClashes = useMemo(() => {
    if (allCourses.length < 2) return false;
    return false;
  }, [allCourses]);

  const filteredCourses = useMemo(() => {
    return allCourses.filter(item => {
      const matchesDay = selectedDay === 'ALL' || item.day?.toUpperCase() === selectedDay.toUpperCase();
      const q = searchQuery.toLowerCase();
      const matchesQuery = !q || 
        item.course_name?.toLowerCase().includes(q) ||
        item.course_id?.toLowerCase().includes(q) ||
        item.lecturer?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q);
      return matchesDay && matchesQuery;
    });
  }, [allCourses, selectedDay, searchQuery]);

  const totalSubjects = new Set(allCourses.map(c => c.course_id)).size;

  // Empty state
  if (allCourses.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4 animate-fade-in">
          <CalendarOff className="w-12 h-12 text-white/10 mx-auto" />
          <div>
            <h3 className="text-sm font-semibold text-white/60">{lang === 'ms' ? 'Tiada Jadual Waktu' : 'No Timetable Found'}</h3>
            <p className="text-xs text-white/25 mt-1 max-w-xs mx-auto">
              {lang === 'ms' ? 'Akaun' : 'Account'} <span className="text-white/40">{session?.user_id}</span> {lang === 'ms' ? 'belum mempunyai rekod jadual waktu.' : 'has no timetable records yet.'}
            </p>
          </div>
          <button
            onClick={refreshTimetable}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/60 text-xs font-medium flex items-center gap-2 mx-auto transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {lang === 'ms' ? 'Muat Semula' : 'Refresh'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      
      {/* ── TOP FILTER BAR ── */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-white/[0.04]">
        <div className="w-full flex items-center gap-3 flex-wrap">
          
          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <span className="text-[10px] text-white/25 font-medium">{totalSubjects} {t('subjects').toLowerCase()}</span>
            <span className="text-white/10">·</span>
            <span className="text-[10px] text-white/25 font-medium">{allCourses.length} {t('sessions').toLowerCase()}</span>
          </div>

          {/* Day Filter Pills */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
            {daysList.map(day => {
              const color = DAY_COLORS[day] || DAY_COLORS['ISNIN'];
              const count = allCourses.filter(c => c.day?.toUpperCase() === day).length;
              const isActive = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isActive ? 'ALL' : day)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                  <span>{day}</span>
                  {count > 0 && <span className="text-[9px] text-white/20">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-40 sm:w-48">
            <Search className="w-3 h-3 text-white/20 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-7 pr-2 py-1.5 rounded-md bg-white/[0.04] border-0 text-[10px] text-white placeholder-white/20 focus:outline-none focus:bg-white/[0.06] font-medium transition-colors"
            />
          </div>

          {/* View Toggle & Expand All */}
          <div className="flex items-center gap-1.5 bg-white/[0.04] rounded-md p-0.5">
            {viewMode === 'cards' && (
              <button
                onClick={() => {
                  const nextExpandAll = !expandAll;
                  setExpandAll(nextExpandAll);
                  if (!nextExpandAll) {
                    setExpandedCards({});
                  }
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                  expandAll ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'text-white/40 hover:text-white/70'
                }`}
                title={expandAll ? t('collapseAll') : t('expandAll')}
              >
                {expandAll ? t('collapseAll') : t('expandAll')}
              </button>
            )}
            <button
              onClick={() => setViewMode('cards')}
              title="Paparan Kad"
              className={`p-1.5 rounded transition-colors ${viewMode === 'cards' ? 'bg-white/[0.08] text-white/70' : 'text-white/20'}`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              title="Paparan Grid"
              className={`p-1.5 rounded transition-colors ${viewMode === 'matrix' ? 'bg-white/[0.08] text-white/70' : 'text-white/20'}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 py-4 space-y-4">
          
          {/* Next Class Widget — compact */}
          <LiveNextClassWidget timetable={allCourses} />

          {/* Clash Detector — collapsible, only if clashes exist */}
          {allCourses.length > 1 && (
            <ScheduleClashDetector timetable={allCourses} />
          )}

          {/* View Content */}
          {viewMode === 'matrix' ? (
            <MatrixGridView timetable={allCourses} days={daysList} />
          ) : filteredCourses.length === 0 ? (
            <div className="py-16 text-center animate-fade-in">
              <BookOpen className="w-8 h-8 text-white/8 mx-auto mb-3" />
              <p className="text-xs text-white/25 font-medium">Tiada kelas pada hari {selectedDay}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
              {filteredCourses.map((course, idx) => {
                const courseId = course.course_id || course.kod_kursus;
                const dayColor = DAY_COLORS[course.day?.toUpperCase()] || DAY_COLORS['ISNIN'];
                const cardKey = `${courseId}_${course.day}_${idx}`;
                const isExpanded = expandAll ? true : !!expandedCards[cardKey];
                const currentNote = courseNotes[courseId] || '';

                return (
                  <div
                    key={cardKey}
                    className={`rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all border-l-2 ${dayColor.accent} animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}
                  >
                    {/* Card Header — Click to expand/collapse independently */}
                    <div 
                      className="p-3 cursor-pointer select-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCards(prev => ({
                          ...prev,
                          [cardKey]: expandAll ? false : !prev[cardKey]
                        }));
                        if (expandAll) setExpandAll(false);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Course Code + Day Badge */}
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-[10px] font-black tracking-wider ${dayColor.text}`}>{courseId}</span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-white/[0.04] text-white/30 uppercase">{course.day}</span>
                          </div>
                          {/* Course Name */}
                          <h3 className="text-[11px] font-semibold text-white/90 leading-snug line-clamp-2">
                            {course.course_name || course.kursus}
                          </h3>
                        </div>

                        {/* Time Badge */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-[10px] font-bold text-white/60">
                            {course.start_time || '—'}
                          </div>
                          {course.end_time && (
                            <div className="text-[8.5px] text-white/25">{course.end_time}</div>
                          )}
                        </div>
                      </div>

                      {/* Compact Info Row */}
                      <div className="flex items-center justify-between gap-2 mt-2 text-[9.5px] text-white/35">
                        <span className="flex items-center gap-1 truncate max-w-[85%]">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-sky-400/60" />
                          <span className="truncate">{course.location || 'TBA'}</span>
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {currentNote && (
                            <span className="text-amber-400/60" title="Nota Wujud">
                              <StickyNote className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-amber-400' : 'text-white/20'}`} />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details — Isolated from header toggle */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2.5 border-t border-white/[0.04] pt-2.5 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Lecturer */}
                        <div 
                          className="flex items-center gap-2 text-[9.5px] cursor-pointer group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLecturer(course.lecturer || course.pensyarah);
                          }}
                        >
                          <User className="w-3 h-3 text-emerald-400/60 flex-shrink-0" />
                          <span className="text-white/60 group-hover:text-amber-300 transition-colors font-medium truncate">
                            {course.lecturer || course.pensyarah || t('lecturers')}
                          </span>
                        </div>

                        {/* Group */}
                        <div className="flex items-center gap-2 text-[9.5px]">
                          <GraduationCap className="w-3 h-3 text-white/25 flex-shrink-0" />
                          <span className="text-white/35 font-medium">{t('group')}: {course.group || course.kumpulan || 'A'}</span>
                        </div>

                        {/* Attendance */}
                        <div className="flex items-center justify-between pt-0.5">
                          <AttendanceMeter percentStr={course.kehadiran} />
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedAttendanceCourse(course); }}
                            className="text-[9px] text-white/25 hover:text-white/50 font-semibold flex items-center gap-1 transition-colors ml-2"
                          >
                            <CalendarCheck className="w-3 h-3 text-sky-400/70" /> Log
                          </button>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1 pt-0.5" onClick={(e) => e.stopPropagation()}>
                          {editingCourseId === courseId ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={noteInput}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setNoteInput(e.target.value)}
                                placeholder={t('addNote')}
                                className="flex-1 bg-white/[0.04] rounded px-2 py-1 text-[9.5px] text-white placeholder-white/20 focus:outline-none font-medium border border-white/10"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSaveNote(courseId); }}
                                className="px-2 py-1 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold"
                              >
                                {t('saveNote')}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingCourseId(courseId); setNoteInput(currentNote); }}
                              className="text-[9px] text-white/20 hover:text-white/40 font-medium flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              {currentNote || t('addNote')}
                            </button>
                          )}
                          {currentNote && editingCourseId !== courseId && (
                            <div className="text-[9.5px] text-amber-300/60 font-medium pl-3 border-l border-amber-400/20">
                              {currentNote}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LecturerModal lecturerName={selectedLecturer} isOpen={!!selectedLecturer} onClose={() => setSelectedLecturer(null)} />
      <AttendanceHistoryModal course={selectedAttendanceCourse} isOpen={!!selectedAttendanceCourse} onClose={() => setSelectedAttendanceCourse(null)} />
    </div>
  );
}
