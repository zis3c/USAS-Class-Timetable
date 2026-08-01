import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { generateTimetablePdf, generateLockscreenImage } from '../utils/pdfGenerator';
import { 
  X, FileText, Download, Smartphone, Monitor, Tablet, Square, RotateCw, MapPin, Award, Layers
} from 'lucide-react';

const DAY_COLORS = {
  'ISNIN':  { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  'SELASA': { bg: 'bg-blue-500/15',    border: 'border-blue-500/30',    text: 'text-blue-400' },
  'RABU':   { bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   text: 'text-amber-400' },
  'KHAMIS': { bg: 'bg-purple-500/15',  border: 'border-purple-500/30',  text: 'text-purple-400' },
  'JUMAAT': { bg: 'bg-red-500/15',     border: 'border-red-500/30',     text: 'text-red-400' },
};

const ALL_TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

export default function PdfExportModal({ isOpen, onClose }) {
  const { timetableData, session } = useAuth();
  const { lang, t } = useLanguage();
  
  // Modes: 'FORMAL_A4' | 'UI_TABLE_A4' | 'WALLPAPER'
  const [exportMode, setExportMode] = useState('FORMAL_A4'); 
  
  // Device Wallpaper Presets: 'phone' (9:16) | 'tablet' (4:3) | 'desktop' (16:9) | 'square' (1:1)
  const [wallpaperPreset, setWallpaperPreset] = useState('phone');

  // Content Detail Customizer: 'CODE' | 'TITLE' | 'CODE_VENUE' | 'FULL'
  const [contentDetail, setContentDetail] = useState('FULL');

  const [exporting, setExporting] = useState(false);
  
  const pdfRef = useRef(null);
  const wallpaperRef = useRef(null);

  const daysList = timetableData?.days || ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];
  const allCourses = timetableData?.timetable || [];
  const studentName = timetableData?.studentName || session?.user_id || 'AHMAD AMIRUL BIN ROSLI';
  const matricNo = session?.user_id || 'AI210042';
  const programName = timetableData?.program || 'BACHELOR OF COMPUTER SCIENCE (HONS)';
  const semesterStr = timetableData?.semester || 'Semester 1 2024/2025';

  const getCourseForSlot = (dayName, slotTime) => {
    return allCourses.find(c => {
      const isDay = c.day?.toUpperCase() === dayName.toUpperCase();
      if (!isDay) return false;
      const startTime = c.start_time || c.jadual || '';
      return startTime.includes(slotTime.split(':')[0]);
    });
  };

  // Automatically filter out trailing empty time slots where no classes exist
  const activeTimeSlots = useMemo(() => {
    let lastIndex = 0;
    ALL_TIME_SLOTS.forEach((slot, idx) => {
      const hasCourse = daysList.some(d => !!getCourseForSlot(d, slot));
      if (hasCourse) {
        lastIndex = idx;
      }
    });
    return ALL_TIME_SLOTS.slice(0, lastIndex + 1);
  }, [allCourses, daysList]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setExporting(true);
    try {
      if (exportMode === 'WALLPAPER') {
        const filename = `USAS_Lockscreen_${wallpaperPreset.toUpperCase()}_${contentDetail}_${matricNo}.png`;
        await generateLockscreenImage(wallpaperRef.current, filename);
      } else {
        const typeStr = exportMode === 'FORMAL_A4' ? 'Formal' : 'UI_Table';
        const filename = `Jadual_USAS_${typeStr}_${matricNo}_LANDSCAPE.pdf`;
        await generateTimetablePdf(pdfRef.current, 'landscape', filename);
      }
    } catch (err) {
      console.error('Export Error:', err);
      alert(lang === 'ms' ? 'Gagal menjana fail. Sila cuba lagi.' : 'Failed to generate file. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const renderCourseContent = (course, isCompact = false) => {
    const code = course.course_id || course.kod_kursus;
    const name = course.course_name || course.kursus;
    const loc = course.location || 'Dewan USAS';

    if (contentDetail === 'CODE') {
      return (
        <div className="font-black text-[10px] sm:text-[11px] truncate text-center py-1">
          {code}
        </div>
      );
    }

    if (contentDetail === 'TITLE') {
      return (
        <div className="font-extrabold text-[9px] sm:text-[10px] leading-tight line-clamp-3">
          {name}
        </div>
      );
    }

    if (contentDetail === 'CODE_VENUE') {
      return (
        <div className="space-y-0.5">
          <div className="font-black text-[9.5px] sm:text-[10.5px] truncate">{code}</div>
          <div className="text-[8px] text-white/50 truncate flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{loc}</span>
          </div>
        </div>
      );
    }

    // FULL
    return (
      <div className="space-y-0.5">
        <div className="font-black text-[9.5px] sm:text-[10px] truncate">{code}</div>
        <div className="font-extrabold text-[8px] sm:text-[9px] leading-tight line-clamp-2 text-white/90">
          {name}
        </div>
        <div className="text-[7.5px] text-white/50 truncate flex items-center gap-0.5">
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">{loc}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-hidden">
      
      {/* Spacious Modal Frame */}
      <div className="glass-card rounded-2xl w-[96vw] max-w-6xl h-[92vh] max-h-[92vh] bg-[#060E1F] border border-white/10 shadow-2xl flex flex-col overflow-hidden my-auto animate-scale-up">
        
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0 bg-[#060E1F]">
          <div className="flex items-center gap-3">
            <img src="/usas-logo.png" alt="USAS Logo" className="w-7 h-7 object-contain" />
            <div>
              <h3 className="text-xs font-bold text-white">{t('exportPdfTitle')}</h3>
              <p className="text-[10px] text-white/40">Eksport Dokumen Rasmi A4, Table View UI, atau Custom Wallpaper Lockscreen peranti</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          
          {/* Main Mode Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            <button
              onClick={() => setExportMode('FORMAL_A4')}
              className={`py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-2 transition-all ${
                exportMode === 'FORMAL_A4'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Dokumen Rasmi (Formal A4)</span>
            </button>

            <button
              onClick={() => setExportMode('UI_TABLE_A4')}
              className={`py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-2 transition-all ${
                exportMode === 'UI_TABLE_A4'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Table View UI (Moden A4)</span>
            </button>

            <button
              onClick={() => setExportMode('WALLPAPER')}
              className={`py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-2 transition-all ${
                exportMode === 'WALLPAPER'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Wallpaper Lockscreen (Custom)</span>
            </button>
          </div>

          {/* CUSTOMIZERS FOR WALLPAPER MODE */}
          {exportMode === 'WALLPAPER' && (
            <div className="space-y-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
              
              {/* 1. Device Ratio Selector */}
              <div>
                <label className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider block mb-1.5">
                  Pilih Nisbah Peranti (Aspect Ratio)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setWallpaperPreset('phone')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      wallpaperPreset === 'phone' ? 'bg-amber-400/10 border-amber-400 text-amber-300' : 'bg-white/[0.02] border-white/10 text-white/40'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold">Telefon (9:16)</div>
                      <div className="text-[9px] opacity-60">iPhone / Android</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setWallpaperPreset('tablet')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      wallpaperPreset === 'tablet' ? 'bg-amber-400/10 border-amber-400 text-amber-300' : 'bg-white/[0.02] border-white/10 text-white/40'
                    }`}
                  >
                    <Tablet className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold">Tablet (4:3)</div>
                      <div className="text-[9px] opacity-60">iPad / Pad</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setWallpaperPreset('desktop')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      wallpaperPreset === 'desktop' ? 'bg-amber-400/10 border-amber-400 text-amber-300' : 'bg-white/[0.02] border-white/10 text-white/40'
                    }`}
                  >
                    <Monitor className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold">Desktop (16:9)</div>
                      <div className="text-[9px] opacity-60">PC & Laptop</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setWallpaperPreset('square')}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      wallpaperPreset === 'square' ? 'bg-amber-400/10 border-amber-400 text-amber-300' : 'bg-white/[0.02] border-white/10 text-white/40'
                    }`}
                  >
                    <Square className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <div className="text-[11px] font-bold">Segi Empat (1:1)</div>
                      <div className="text-[9px] opacity-60">Square Avatar</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Content Detail Customizer */}
              <div>
                <label className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Customize Kandungan Kad Subjek
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setContentDetail('CODE')}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      contentDetail === 'CODE' ? 'bg-amber-400 text-slate-950 font-black border-amber-400' : 'bg-white/[0.02] border-white/10 text-white/50'
                    }`}
                  >
                    <div className="text-[10px] font-bold">Kod Kelas Sahaja</div>
                    <div className="text-[8.5px] opacity-70">CSC2103</div>
                  </button>

                  <button
                    onClick={() => setContentDetail('TITLE')}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      contentDetail === 'TITLE' ? 'bg-amber-400 text-slate-950 font-black border-amber-400' : 'bg-white/[0.02] border-white/10 text-white/50'
                    }`}
                  >
                    <div className="text-[10px] font-bold">Nama Subjek Sahaja</div>
                    <div className="text-[8.5px] opacity-70">Data Structures...</div>
                  </button>

                  <button
                    onClick={() => setContentDetail('CODE_VENUE')}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      contentDetail === 'CODE_VENUE' ? 'bg-amber-400 text-slate-950 font-black border-amber-400' : 'bg-white/[0.02] border-white/10 text-white/50'
                    }`}
                  >
                    <div className="text-[10px] font-bold">Kod + Bilik / Lokasi</div>
                    <div className="text-[8.5px] opacity-70">CSC2103 • MK3</div>
                  </button>

                  <button
                    onClick={() => setContentDetail('FULL')}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      contentDetail === 'FULL' ? 'bg-amber-400 text-slate-950 font-black border-amber-400' : 'bg-white/[0.02] border-white/10 text-white/50'
                    }`}
                  >
                    <div className="text-[10px] font-bold">Semua (Lengkap)</div>
                    <div className="text-[8.5px] opacity-70">Kod + Nama + Bilik</div>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ── MODE 1: FORMAL PRINTABLE A4 DOCUMENT ── */}
          {exportMode === 'FORMAL_A4' && (
            <div className="overflow-x-auto border border-white/10 rounded-xl p-3 bg-white text-slate-950">
              <div 
                ref={pdfRef}
                className="bg-white text-slate-950 p-6 rounded-lg text-xs font-sans shadow-inner border border-slate-300 min-w-[820px]"
              >
                <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src="/usas-logo.png" alt="USAS Crest" className="w-11 h-11 object-contain" />
                    <div>
                      <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">
                        UNIVERSITI SULTAN AZLAN SHAH (USAS)
                      </h1>
                      <h2 className="text-xs font-bold text-amber-800 uppercase">
                        JADUAL WAKTU KULIAH PELAJAR
                      </h2>
                      <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                        {semesterStr}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[9.5px] text-slate-600 font-semibold">
                    <div>Tarikh Cetakan: {new Date().toLocaleDateString('ms-MY')}</div>
                    <div>Format: A4 LANDSCAPE</div>
                    <div className="text-amber-800 font-bold">DOKUMEN RASMI</div>
                  </div>
                </div>

                <div className="bg-slate-100 p-3 rounded border border-slate-300 mb-4 grid grid-cols-2 gap-2 text-[10.5px]">
                  <div>
                    <span className="font-bold text-slate-700">NAMA PELAJAR:</span> <span className="font-extrabold text-slate-900">{studentName}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">NO. MATRIK:</span> <span className="font-extrabold text-slate-900">{matricNo}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold text-slate-700">PROGRAM:</span> <span className="font-extrabold text-slate-900">{programName}</span>
                  </div>
                </div>

                <table className="w-full border-collapse border border-slate-400 text-[10px]">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="border border-slate-400 p-2 text-center w-20">HARI</th>
                      <th className="border border-slate-400 p-2 text-center w-28">WAKTU</th>
                      <th className="border border-slate-400 p-2 text-left w-24">KOD</th>
                      <th className="border border-slate-400 p-2 text-left">NAMA KURSUS</th>
                      <th className="border border-slate-400 p-2 text-center w-12">GRP</th>
                      <th className="border border-slate-400 p-2 text-left w-36">LOKASI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCourses.map((c, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 p-2 text-center font-bold text-amber-800">{c.day}</td>
                        <td className="border border-slate-300 p-2 text-center font-medium">
                          {c.start_time ? `${c.start_time} - ${c.end_time}` : (c.jadual || '-')}
                        </td>
                        <td className="border border-slate-300 p-2 font-bold text-blue-900">{c.course_id || c.kod_kursus}</td>
                        <td className="border border-slate-300 p-2 font-semibold text-slate-900">{c.course_name || c.kursus}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold">{c.group || c.kumpulan || 'A'}</td>
                        <td className="border border-slate-300 p-2 text-slate-800">{c.location || 'Dewan USAS'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 pt-2 border-t border-slate-300 text-[9px] text-slate-500 flex justify-between items-center">
                  <span>Dokumen rasmi ini dijana daripada Portal Jadual Waktu Kuliah USAS.</span>
                  <span>Mukasurat 1 / 1</span>
                </div>
              </div>
            </div>
          )}

          {/* ── MODE 2: DARK MODERN UI TABLE A4 ── */}
          {exportMode === 'UI_TABLE_A4' && (
            <div className="overflow-x-auto border border-white/10 rounded-xl p-3 bg-[#060E1F]">
              <div 
                ref={pdfRef}
                className="bg-[#070F22] text-white p-5 rounded-xl text-xs font-sans shadow-2xl border border-white/[0.06] min-w-[840px]"
              >
                <div className="border-b border-white/10 pb-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/usas-logo.png" alt="USAS Logo" className="w-9 h-9 object-contain" />
                    <div>
                      <h1 className="text-xs font-black tracking-wider text-amber-400 uppercase">UNIVERSITI SULTAN AZLAN SHAH</h1>
                      <p className="text-[10px] font-bold text-white/80">{studentName} ({matricNo}) • {programName}</p>
                      <p className="text-[9px] text-white/40 font-medium">{semesterStr} • Jadual Waktu Kuliah</p>
                    </div>
                  </div>
                  <div className="text-right text-[9px] text-white/30 font-medium">
                    <div>Format UI Table Moden</div>
                    <div>{new Date().toLocaleDateString('ms-MY')}</div>
                  </div>
                </div>

                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-black text-amber-400/80 text-[10px] uppercase tracking-wider w-20 border-r border-white/[0.06]">
                        Waktu
                      </th>
                      {daysList.map(d => {
                        const color = DAY_COLORS[d] || DAY_COLORS['ISNIN'];
                        return (
                          <th key={d} className={`p-2 text-center font-black text-[10px] uppercase tracking-wider border-r border-white/[0.06] ${color.text}`}>
                            {d}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTimeSlots.map((slot) => (
                      <tr key={slot} className="border-t border-white/[0.04]">
                        <td className="p-2 font-bold text-white/40 text-[9.5px] border-r border-white/[0.06]">
                          {slot}
                        </td>
                        {daysList.map(d => {
                          const course = getCourseForSlot(d, slot);
                          const color = DAY_COLORS[d] || DAY_COLORS['ISNIN'];
                          return (
                            <td key={d} className="p-1 border-r border-white/[0.04] h-14 vertical-align-top">
                              {course ? (
                                <div className={`p-1.5 rounded-lg ${color.bg} border ${color.border} text-white shadow-sm h-full flex flex-col justify-center`}>
                                  {renderCourseContent(course)}
                                </div>
                              ) : (
                                <div className="h-full w-full rounded-md border border-dashed border-white/[0.02]" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MODE 3: DEVICE LOCK SCREEN WALLPAPER (Custom Presets & Content Controls) ── */}
          {exportMode === 'WALLPAPER' && (
            <div className="space-y-3">
              <div className="flex justify-center py-3 bg-[#060D1A] rounded-xl border border-white/[0.04] overflow-x-auto">
                
                <div 
                  ref={wallpaperRef}
                  className={`bg-[#070F22] text-white font-sans flex flex-col justify-between p-4 relative overflow-hidden select-none border border-white/10 rounded-3xl transition-all ${
                    wallpaperPreset === 'phone'
                      ? 'w-[340px] h-[640px]'
                      : wallpaperPreset === 'tablet'
                        ? 'w-[520px] h-[640px]'
                        : wallpaperPreset === 'square'
                          ? 'w-[480px] h-[480px]'
                          : 'w-[780px] h-[480px]'
                  }`}
                >
                  {/* Top Reserved Clock Area */}
                  <div className={`${(wallpaperPreset === 'desktop' || wallpaperPreset === 'square') ? 'h-[70px]' : 'h-[150px]'} flex flex-col items-center justify-center text-center opacity-25 flex-shrink-0`}>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-mono">
                      [ Lock Screen Clock & Widget Area ]
                    </span>
                  </div>

                  {/* Lock Screen Matrix Grid */}
                  <div className="bg-[#0A1428] border border-white/[0.08] rounded-xl p-2.5 shadow-2xl space-y-2 flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 px-1 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <img src="/usas-logo.png" alt="USAS" className="w-4 h-4 object-contain" />
                        <span className="text-[10px] font-black text-amber-400 tracking-wider">USAS TIMETABLE</span>
                      </div>
                      <span className="text-[9px] text-white/40 font-medium">{studentName} ({matricNo})</span>
                    </div>

                    <table className="w-full border-collapse text-[8.5px] flex-1">
                      <thead>
                        <tr>
                          <th className="p-1 text-left font-black text-amber-400/80 uppercase tracking-wider w-12 border-r border-white/[0.06]">
                            Waktu
                          </th>
                          {daysList.map(d => {
                            const color = DAY_COLORS[d] || DAY_COLORS['ISNIN'];
                            return (
                              <th key={d} className={`p-1 text-center font-black uppercase tracking-wider border-r border-white/[0.06] ${color.text}`}>
                                {d}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {activeTimeSlots.map((slot) => (
                          <tr key={slot} className="border-t border-white/[0.04]">
                            <td className="p-1 font-bold text-white/40 text-[8px] border-r border-white/[0.06]">
                              {slot}
                            </td>
                            {daysList.map(d => {
                              const course = getCourseForSlot(d, slot);
                              const color = DAY_COLORS[d] || DAY_COLORS['ISNIN'];
                              return (
                                <td key={d} className="p-1 border-r border-white/[0.04] h-11 vertical-align-top">
                                  {course ? (
                                    <div className={`p-1 rounded ${color.bg} border ${color.border} text-white shadow-sm h-full flex flex-col justify-center`}>
                                      {renderCourseContent(course, true)}
                                    </div>
                                  ) : (
                                    <div className="h-full w-full rounded border border-dashed border-white/[0.01]" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-center pt-2 text-[8px] font-bold tracking-widest text-white/20 uppercase flex-shrink-0">
                    UNIVERSITI SULTAN AZLAN SHAH • WALLPAPER
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] flex items-center justify-end gap-2 flex-shrink-0 bg-[#060E1F]">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-white/40 hover:text-white text-xs font-semibold"
          >
            {t('cancel')}
          </button>

          <button
            onClick={handleDownload}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-400/10 disabled:opacity-50"
          >
            {exporting ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>
                  {exportMode === 'WALLPAPER' 
                    ? `Muat Turun Wallpaper ${wallpaperPreset.toUpperCase()} (.PNG)` 
                    : `Muat Turun PDF (${exportMode === 'FORMAL_A4' ? 'Formal' : 'Moden UI'} LANDSCAPE)`}
                </span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
