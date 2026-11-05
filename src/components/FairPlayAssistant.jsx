import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Scale, 
  CheckCircle2, 
  ChevronRight, 
  Trophy, 
  UserCheck, 
  Award, 
  HelpCircle 
} from 'lucide-react';

/**
 * FairPlayAssistant
 * Interaktivní widget na Dashboardu doporučující Top 3 kandidáty
 * s nejnižším počtem čárek pro spravedlivé přidělení dalšího dozoru či suplování.
 */
export default function FairPlayAssistant({ summary = [], records = [], onSelectTeacher }) {
  // Mode: 'duty' (Dozor) | 'substitution' (Suplování) | 'total' (Celková zátěž)
  const [filterMode, setFilterMode] = useState('duty');

  // Compute workload for all teachers present in summary or records
  const teacherWorkloads = useMemo(() => {
    if (!summary || summary.length === 0) return [];

    return summary.map((t) => ({
      teacher_name: t.teacher_name,
      hours_count: Number(t.hours_count || 0),
      duties_count: Number(t.duties_count || 0),
      replacements_count: Number(t.replacements_count || 0),
      total_count: Number(t.total_count || 0),
    }));
  }, [summary]);

  // Sort ascending based on active filter
  const rankedCandidates = useMemo(() => {
    const list = [...teacherWorkloads];

    if (filterMode === 'duty') {
      // Prioritize lowest duties, then lowest total
      list.sort((a, b) => {
        if (a.duties_count !== b.duties_count) return a.duties_count - b.duties_count;
        if (a.total_count !== b.total_count) return a.total_count - b.total_count;
        return a.teacher_name.localeCompare(b.teacher_name, 'cs');
      });
    } else if (filterMode === 'substitution') {
      // Prioritize lowest hours, then lowest total
      list.sort((a, b) => {
        if (a.hours_count !== b.hours_count) return a.hours_count - b.hours_count;
        if (a.total_count !== b.total_count) return a.total_count - b.total_count;
        return a.teacher_name.localeCompare(b.teacher_name, 'cs');
      });
    } else {
      // Prioritize lowest total count, then lowest duties
      list.sort((a, b) => {
        if (a.total_count !== b.total_count) return a.total_count - b.total_count;
        if (a.duties_count !== b.duties_count) return a.duties_count - b.duties_count;
        return a.teacher_name.localeCompare(b.teacher_name, 'cs');
      });
    }

    return list.slice(0, 3);
  }, [teacherWorkloads, filterMode]);

  if (summary.length === 0) {
    return null;
  }

  const medals = [
    { rank: '1.', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: Trophy, label: '1. volba' },
    { rank: '2.', bg: 'bg-teal-100 text-teal-800 border-teal-300', icon: Award, label: '2. volba' },
    { rank: '3.', bg: 'bg-sky-100 text-sky-800 border-sky-300', icon: UserCheck, label: '3. volba' },
  ];

  return (
    <div className="bg-gradient-to-br from-emerald-900/5 via-teal-900/5 to-slate-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Fair-play asistent</h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Chytré doporučení
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Komu přidělit dozor / suplování?</p>
          </div>
        </div>

        {/* Filter Mode Switcher */}
        <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('duty')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterMode === 'duty'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Doporučit vyučující s nejméně dozory"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Na dozor</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('substitution')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterMode === 'substitution'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Doporučit vyučující s nejméně suplovanými hodinami"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Na suplování</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('total')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterMode === 'total'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Doporučit vyučující s nejnižší celkovou zátěží"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Celkově</span>
          </button>
        </div>
      </div>

      {/* Candidates List */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rankedCandidates.map((candidate, idx) => {
          const medal = medals[idx] || medals[2];
          const isSelected = filterMode === 'duty';

          return (
            <div
              key={candidate.teacher_name}
              onClick={() => onSelectTeacher && onSelectTeacher(candidate.teacher_name)}
              className="group relative bg-white/90 hover:bg-white rounded-xl p-3 border border-slate-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Top badge & rank */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${medal.bg}`}>
                    <span>{medal.label}</span>
                  </span>
                  <div className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors flex items-center gap-0.5">
                    <span>Detail</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Teacher Name */}
                <div className="font-bold text-slate-900 text-sm tracking-tight truncate group-hover:text-emerald-950">
                  {candidate.teacher_name}
                </div>
              </div>

              {/* Workload Pills */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                {filterMode === 'duty' ? (
                  <>
                    <div className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>{candidate.duties_count} {candidate.duties_count === 1 ? 'dozor' : (candidate.duties_count >= 2 && candidate.duties_count <= 4 ? 'dozory' : 'dozorů')}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Celkem: <strong className="text-slate-800">{candidate.total_count}</strong>
                    </span>
                  </>
                ) : filterMode === 'substitution' ? (
                  <>
                    <div className="flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/80">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{candidate.hours_count} {candidate.hours_count === 1 ? 'hodina' : (candidate.hours_count >= 2 && candidate.hours_count <= 4 ? 'hodiny' : 'hodin')}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Celkem: <strong className="text-slate-800">{candidate.total_count}</strong>
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                      <Scale className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{candidate.total_count} celkem</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {candidate.hours_count}h / {candidate.duties_count}d
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
