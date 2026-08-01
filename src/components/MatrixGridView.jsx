import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';

const DAY_COLORS = {
  'ISNIN':  { bg: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/25', text: 'text-emerald-400' },
  'SELASA': { bg: 'from-blue-500/15 to-blue-500/5', border: 'border-blue-500/25', text: 'text-blue-400' },
  'RABU':   { bg: 'from-amber-500/15 to-amber-500/5', border: 'border-amber-500/25', text: 'text-amber-400' },
  'KHAMIS': { bg: 'from-purple-500/15 to-purple-500/5', border: 'border-purple-500/25', text: 'text-purple-400' },
  'JUMAAT': { bg: 'from-red-500/15 to-red-500/5', border: 'border-red-500/25', text: 'text-red-400' },
};

const ALL_TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

export default function MatrixGridView({ timetable = [], days = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'] }) {
  
  const getCourseForSlot = (dayName, slotTime) => {
    return timetable.find(c => {
      const isDay = c.day?.toUpperCase() === dayName.toUpperCase();
      if (!isDay) return false;
      const startTime = c.start_time || c.jadual || '';
      return startTime.includes(slotTime.split(':')[0]);
    });
  };

  // Filter out trailing empty time slots where no classes take place
  const activeTimeSlots = useMemo(() => {
    let lastIndex = 0;
    ALL_TIME_SLOTS.forEach((slot, idx) => {
      const hasCourse = days.some(d => !!getCourseForSlot(d, slot));
      if (hasCourse) {
        lastIndex = idx;
      }
    });
    // Return slots up to the last active class slot
    return ALL_TIME_SLOTS.slice(0, lastIndex + 1);
  }, [timetable, days]);

  return (
    <div className="glass-card rounded-2xl p-3 overflow-x-auto shadow-2xl animate-fade-in">
      <div className="min-w-[700px]">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2.5 text-left font-black text-amber-400/80 text-[10px] uppercase tracking-wider w-20 border-r border-white/[0.04]">
                Waktu
              </th>
              {days.map(d => {
                const color = DAY_COLORS[d] || DAY_COLORS['ISNIN'];
                return (
                  <th key={d} className={`p-2.5 text-center font-black text-[10px] uppercase tracking-wider border-r border-white/[0.04] ${color.text}`}>
                    {d}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {activeTimeSlots.map((slot) => (
              <tr key={slot} className="border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="p-2 font-bold text-slate-500 text-[10px] border-r border-white/[0.04]">
                  {slot}
                </td>
                {days.map(d => {
                  const course = getCourseForSlot(d, slot);
                  const color = DAY_COLORS[d] || DAY_COLORS['ISNIN'];
                  return (
                    <td key={d} className="p-1.5 border-r border-white/[0.03] h-16">
                      {course ? (
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${color.bg} border ${color.border} text-white space-y-0.5 shadow-sm transition-all hover:scale-[1.02]`}>
                          <div className={`font-black text-[10px] truncate ${color.text}`}>
                            {course.course_id || course.kod_kursus}
                          </div>
                          <div className="font-extrabold text-[9px] leading-tight line-clamp-2 text-white/90">
                            {course.course_name || course.kursus}
                          </div>
                          <div className="text-[8px] text-slate-400 truncate flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                            <span>{course.location}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full w-full rounded-md border border-dashed border-white/[0.03]" />
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
  );
}
