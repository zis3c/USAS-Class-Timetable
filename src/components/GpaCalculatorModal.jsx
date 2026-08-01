import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Calculator, Award, Sparkles, Check } from 'lucide-react';

export default function GpaCalculatorModal({ isOpen, onClose, courses = [] }) {
  const { t } = useLanguage();

  const gradePoints = {
    'A': 4.0, 'A-': 3.67, 'B+': 3.33, 'B': 3.0,
    'B-': 2.67, 'C+': 2.33, 'C': 2.0, 'D': 1.0, 'F': 0.0
  };

  // State mapping course id to { credits, grade }
  const [courseTargets, setCourseTargets] = useState(() => {
    const initial = {};
    courses.forEach(c => {
      const id = c.course_id || c.kod_kursus;
      initial[id] = { credits: 3, grade: 'A' };
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleTargetChange = (courseId, field, value) => {
    setCourseTargets(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        [field]: value
      }
    }));
  };

  // Calculate GPA
  let totalPoints = 0;
  let totalCredits = 0;

  Object.values(courseTargets).forEach(item => {
    const cred = parseInt(item.credits, 10) || 0;
    const pts = gradePoints[item.grade] || 4.0;
    totalPoints += pts * cred;
    totalCredits += cred;
  });

  const estGpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '4.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070F22]/90 backdrop-blur-md overflow-y-auto">
      
      <div className="glass-card rounded-3xl w-full max-w-2xl border border-amber-500/20 bg-[#0F2148] shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-amber-500/15 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">{t('gpaTitle')}</h3>
              <p className="text-xs text-amber-400/90 font-medium">Kira anggaran GPA semester berdasarkan sasaran gred subjek anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* GPA Result Display Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#070F22] via-[#0B1B3D] to-[#070F22] border border-amber-500/30 flex items-center justify-between shadow-inner">
            <div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t('estGpa')}</div>
              <div className="text-3xl font-black text-amber-400 mt-0.5">{estGpa} <span className="text-xs font-semibold text-slate-400">/ 4.00</span></div>
            </div>

            <div className="text-right">
              {parseFloat(estGpa) >= 3.75 ? (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400/10 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" /> Target Anugerah Dekan
                </span>
              ) : parseFloat(estGpa) >= 3.0 ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Kepujian Baik (First/Second Upper)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Status Memuaskan
                </span>
              )}
              <div className="text-[10px] text-slate-400 mt-1 font-semibold">Jumlah Kredit: {totalCredits} jam kredit</div>
            </div>
          </div>

          {/* Subject Grade Target Table */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {courses.map((c, i) => {
              const id = c.course_id || c.kod_kursus;
              const target = courseTargets[id] || { credits: 3, grade: 'A' };
              return (
                <div key={i} className="p-3.5 rounded-xl bg-[#070F22] border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-amber-400">{id}</div>
                    <div className="font-semibold text-white truncate">{c.course_name || c.kursus}</div>
                  </div>

                  {/* Credit Hours Input */}
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400 font-medium">Jam Kredit:</span>
                    <select
                      value={target.credits}
                      onChange={(e) => handleTargetChange(id, 'credits', e.target.value)}
                      className="bg-[#0F2148] border border-amber-500/20 text-white rounded-lg px-2 py-1 font-bold text-xs focus:outline-none"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>

                  {/* Target Grade Selector */}
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400 font-medium">Sasaran:</span>
                    <select
                      value={target.grade}
                      onChange={(e) => handleTargetChange(id, 'grade', e.target.value)}
                      className="bg-[#0F2148] border border-amber-500/20 text-amber-300 font-black rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                    >
                      {Object.keys(gradePoints).map(g => (
                        <option key={g} value={g}>{g} ({gradePoints[g]})</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-amber-500/15 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-md"
          >
            {t('close')}
          </button>
        </div>

      </div>

    </div>
  );
}
