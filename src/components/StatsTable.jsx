import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  ShieldAlert, 
  ChevronRight, 
  Search, 
  ArrowUpDown, 
  AlertTriangle,
  Award,
  Sparkles,
  BarChart3
} from 'lucide-react';

/**
 * Renders tally marks (čárky) representation:
 * E.g. 7 => 卌 || (represented nicely as 5er groups or SVG tick bars)
 */
function TallyMarks({ count }) {
  if (!count || count <= 0) return <span className="text-slate-300">-</span>;

  // We group tallies into groups of 5
  const fullGroups = Math.floor(count / 5);
  const remainder = count % 5;

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs select-none">
      {Array.from({ length: fullGroups }).map((_, i) => (
        <span
          key={`g-${i}`}
          title="5"
          className="inline-block px-1 py-0.5 bg-slate-100 rounded text-slate-700 font-bold tracking-widest border border-slate-200"
        >
          ||||̶
        </span>
      ))}
      {remainder > 0 && (
        <span
          title={String(remainder)}
          className="inline-block px-1 py-0.5 bg-slate-50 rounded text-slate-700 font-bold tracking-widest"
        >
          {'|'.repeat(remainder)}
        </span>
      )}
    </div>
  );
}

export default function StatsTable({ summary, records, totals, onSelectTeacher }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('total_count'); // 'teacher_name' | 'hours_count' | 'duties_count' | 'total_count'
  const [sortAsc, setSortAsc] = useState(false);
  const [showTallyMode, setShowTallyMode] = useState(true);

  // Maximum duties in this period to highlight
  const maxDuties = useMemo(() => {
    if (!summary || summary.length === 0) return 0;
    return Math.max(...summary.map((s) => Number(s.duties_count || 0)));
  }, [summary]);

  // Teachers with the highest number of duties
  const topDutyTeachers = useMemo(() => {
    if (maxDuties === 0) return [];
    return summary
      .filter((s) => Number(s.duties_count) === maxDuties)
      .map((s) => s.teacher_name);
  }, [summary, maxDuties]);

  // Filter & sort
  const filteredSummary = useMemo(() => {
    let list = summary.filter((s) =>
      s.teacher_name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'teacher_name') {
        const cmp = a.teacher_name.localeCompare(b.teacher_name, 'cs');
        return sortAsc ? cmp : -cmp;
      }

      valA = Number(valA || 0);
      valB = Number(valB || 0);
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [summary, searchTerm, sortField, sortAsc]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hodiny */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suplované hodiny</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totals.totalHours || 0}</p>
          </div>
        </div>

        {/* Card 2: Dozory */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Počet dozorů</p>
            <p className="text-2xl font-black text-amber-700 mt-0.5">{totals.totalDuties || 0}</p>
          </div>
        </div>

        {/* Card 3: Celková zátěž */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Celková zátěž</p>
            <p className="text-2xl font-black text-indigo-900 mt-0.5">{totals.grandTotal || 0}</p>
          </div>
        </div>

        {/* Card 4: Zapojení učitelé */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktivní učitelé</p>
            <p className="text-2xl font-black text-emerald-800 mt-0.5">{totals.teachersCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Duty Balance Alert (Rovnoměrnost dozorů) */}
      {maxDuties > 0 && topDutyTeachers.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 p-4 rounded-r-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold text-amber-950">Kontrola rovnoměrnosti dozorů:</span>
            <span className="text-amber-900 ml-1.5">
              Nejvyšší počet dozorů v tomto období (<strong>{maxDuties}</strong>) má vyučující:{' '}
              <strong className="text-amber-950">{topDutyTeachers.join(', ')}</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Controls: Search and Tally Toggle */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Vyhledat učitele..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Tally visualization toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTallyMode(!showTallyMode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                showTallyMode
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {showTallyMode ? '✓ Zobrazovat čárky (tallies)' : 'Číselné zobrazení'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-700 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                {/* Učitel */}
                <th
                  className="py-3.5 px-4 sm:px-6 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('teacher_name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Učitel</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>

                {/* Suplované hodiny */}
                <th
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('hours_count')}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Suplované hodiny</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>

                {/* Dozory */}
                <th
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('duties_count')}
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dozory</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>

                {/* Celkem */}
                <th
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleSort('total_count')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Celkem</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>

                {/* Akce */}
                <th className="py-3.5 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummary.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">
                    {summary.length === 0
                      ? 'Pro vybrané období nebyly nalezeny žádné záznamy. Nahrajte denní rozpis z EduPage.'
                      : 'Žádný učitel neodpovídá vyhledávání.'}
                  </td>
                </tr>
              ) : (
                filteredSummary.map((t) => {
                  const isMaxDuties = maxDuties > 0 && Number(t.duties_count) === maxDuties;
                  return (
                    <tr
                      key={t.teacher_name}
                      onClick={() => onSelectTeacher(t.teacher_name)}
                      className={`cursor-pointer transition-colors ${
                        isMaxDuties
                          ? 'bg-amber-50/40 hover:bg-amber-100/50'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Teacher Column */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isMaxDuties
                                ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {t.teacher_name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">{t.teacher_name}</span>
                            {isMaxDuties && (
                              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                                <Award className="w-3 h-3 text-amber-700" />
                                Nejvíce dozorů ({t.duties_count})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Suplované hodiny */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-blue-700 min-w-[1.5rem]">
                            {t.hours_count}
                          </span>
                          {showTallyMode && <TallyMarks count={t.hours_count} />}
                        </div>
                      </td>

                      {/* Dozory */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-bold min-w-[1.5rem] ${
                              isMaxDuties ? 'text-amber-700 font-black' : 'text-slate-800'
                            }`}
                          >
                            {t.duties_count}
                          </span>
                          {showTallyMode && <TallyMarks count={t.duties_count} />}
                        </div>
                      </td>

                      {/* Celkem */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-900">
                          {t.total_count}
                        </span>
                      </td>

                      {/* Detail button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTeacher(t.teacher_name);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 p-1.5 hover:bg-brand-50 rounded-lg transition-colors"
                        >
                          <span>Zobrazit</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
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

