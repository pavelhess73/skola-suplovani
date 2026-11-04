import React, { useState, useMemo } from 'react';
import { 
  UserX, 
  Users, 
  HeartPulse, 
  Stethoscope, 
  GraduationCap, 
  Calendar, 
  Search, 
  Filter, 
  Baby, 
  Briefcase, 
  Sparkles,
  Clock
} from 'lucide-react';
import { formatIsoToCzech } from '../utils/dateUtils';

/**
 * Returns icon and badge styling for common Czech absence reasons
 */
function getReasonBadgeStyle(reason = '') {
  const norm = reason.toLowerCase();
  if (norm.includes('sick')) {
    return {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: HeartPulse,
    };
  }
  if (norm.includes('lékař') || norm.includes('lekar') || norm.includes('doktor')) {
    return {
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
      icon: Stethoscope,
    };
  }
  if (norm.includes('školení') || norm.includes('skoleni') || norm.includes('seminář')) {
    return {
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      dot: 'bg-purple-500',
      icon: GraduationCap,
    };
  }
  if (norm.includes('očr') || norm.includes('ocr') || norm.includes('dítě')) {
    return {
      bg: 'bg-pink-50 text-pink-800 border-pink-200',
      dot: 'bg-pink-500',
      icon: Baby,
    };
  }
  if (norm.includes('dovolená') || norm.includes('dovolena')) {
    return {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      icon: Briefcase,
    };
  }
  return {
    bg: 'bg-slate-100 text-slate-800 border-slate-200',
    dot: 'bg-slate-400',
    icon: UserX,
  };
}

export default function AbsencesView({ absences = [], absenceSummary = {}, activeRange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReason, setSelectedReason] = useState('ALL'); // 'ALL' or specific reason

  const byReason = absenceSummary.byReason || [];
  const byTeacher = absenceSummary.byTeacher || [];
  const totalAbsences = absences.length;

  // Filtered absences list
  const filteredAbsences = useMemo(() => {
    return absences.filter((a) => {
      const matchSearch = a.teacher_name.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchReason = selectedReason === 'ALL' || a.reason === selectedReason;
      return matchSearch && matchReason;
    });
  }, [absences, searchTerm, selectedReason]);

  // Top reason
  const topReason = byReason.length > 0 ? byReason[0].reason : '-';

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total absences */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Celkem absencí</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalAbsences}</p>
          </div>
        </div>

        {/* Card 2: Affected teachers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chybějících pedagogů</p>
            <p className="text-2xl font-black text-blue-900 mt-0.5">{byTeacher.length}</p>
          </div>
        </div>

        {/* Card 3: Top reason */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nejčastější důvod</p>
            <p className="text-xl font-black text-slate-900 mt-0.5 truncate max-w-[200px]" title={topReason}>
              {topReason}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown by Reasons (Cards with visual bars) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Rozpad absencí podle důvodů</h3>
          </div>
          {selectedReason !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedReason('ALL')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              Zrušit filtr ({selectedReason})
            </button>
          )}
        </div>

        {byReason.length === 0 ? (
          <p className="text-sm text-slate-400 py-3">V tomto období nejsou zaznamenány žádné absence.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {byReason.map((item) => {
              const style = getReasonBadgeStyle(item.reason);
              const Icon = style.icon;
              const isSelected = selectedReason === item.reason;
              const percent = totalAbsences > 0 ? Math.round((item.count / totalAbsences) * 100) : 0;

              return (
                <div
                  key={item.reason}
                  onClick={() => setSelectedReason(isSelected ? 'ALL' : item.reason)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 shadow-xs ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-slate-900 truncate">
                      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="truncate" title={item.reason}>{item.reason}</span>
                    </span>
                    <span className="text-sm font-black text-slate-900 px-2 py-0.5 rounded-md bg-slate-100">
                      {item.count}×
                    </span>
                  </div>

                  {/* Percentage bar */}
                  <div className="mt-2.5">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">
                      {percent}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Table Card: Detailed Absences */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header with Search */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">Seznam absencí v období</h3>
            <span className="text-xs text-slate-500">({filteredAbsences.length} záznamů)</span>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Hledat učitele..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Datum</th>
                <th className="py-3.5 px-4">Chybějící vyučující</th>
                <th className="py-3.5 px-4">Důvod absence</th>
                <th className="py-3.5 px-4">Kdy / Rozsah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAbsences.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400 text-sm">
                    {absences.length === 0
                      ? 'Pro vybrané období nebyly nalezeny žádné záznamy o absencích.'
                      : 'Žádná absence neodpovídá zvolenému filtru.'}
                  </td>
                </tr>
              ) : (
                filteredAbsences.map((item, idx) => {
                  const style = getReasonBadgeStyle(item.reason);
                  const Icon = style.icon;

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 sm:px-6 whitespace-nowrap font-medium text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-600" />
                          {formatIsoToCzech(item.date)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.teacher_name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.reason}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="flex items-center gap-1 text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {item.time_range}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

