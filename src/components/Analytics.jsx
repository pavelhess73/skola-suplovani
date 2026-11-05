import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  AlertOctagon,
  School,
  HeartPulse,
  RefreshCw,
  Layers,
  BookOpen,
  DoorOpen,
  PieChart as PieIcon,
} from 'lucide-react';
import { fetchAnalytics } from '../services/api';

/**
 * Custom Tooltip for Line Chart
 */
function CustomLineTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5">
        <p className="font-bold text-slate-200 border-b border-slate-700/80 pb-1 mb-1">
          Období: <span className="text-white">{label}</span>
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300">{entry.name}:</span>
            </div>
            <span className="font-mono font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Custom Tooltip for Bar Charts
 */
function CustomBarTooltip({ active, payload, label, unit = 'hodin' }) {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs">
        <p className="font-bold text-slate-100">{label}</p>
        <p className="mt-1 text-slate-300">
          Zaznamenáno: <strong className="text-indigo-400 font-mono text-sm">{entry.value}</strong> {unit}
        </p>
      </div>
    );
  }
  return null;
}

const BAR_COLORS_SUBJECTS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];
const BAR_COLORS_CLASSES = ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc'];

export default function Analytics({ activeRange }) {
  const [timelineMode, setTimelineMode] = useState('weekly'); // 'weekly' | 'monthly'
  const [scopeMode, setScopeMode] = useState('all'); // 'all' (celý školní rok) | 'range' (vybrané období)
  const [data, setData] = useState({
    weeklyTimeline: [],
    monthlyTimeline: [],
    topSubjects: [],
    topClassrooms: [],
    topReasons: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load analytics data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const startDate = scopeMode === 'range' && activeRange ? activeRange.startDate : undefined;
        const endDate = scopeMode === 'range' && activeRange ? activeRange.endDate : undefined;

        const res = await fetchAnalytics(startDate, endDate);
        if (isMounted) {
          if (res.success) {
            setData({
              weeklyTimeline: res.weeklyTimeline || [],
              monthlyTimeline: res.monthlyTimeline || [],
              topSubjects: res.topSubjects || [],
              topClassrooms: res.topClassrooms || [],
              topReasons: res.topReasons || [],
            });
          } else {
            setError(res.error || 'Nepodařilo se načíst data pro analytiku.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Chyba při komunikaci s analytickým rozhraním.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeRange, scopeMode]);

  // Active timeline dataset
  const activeTimeline = useMemo(() => {
    return timelineMode === 'weekly' ? data.weeklyTimeline : data.monthlyTimeline;
  }, [timelineMode, data.weeklyTimeline, data.monthlyTimeline]);

  // Calculate high-level KPIs
  const kpis = useMemo(() => {
    let totalAbsences = 0;
    data.weeklyTimeline.forEach((w) => {
      totalAbsences += Number(w.total_absences || 0);
    });

    const topSubject = data.topSubjects[0] ? `${data.topSubjects[0].name} (${data.topSubjects[0].count}×)` : 'Žádná data';
    const topClassroom = data.topClassrooms[0] ? `${data.topClassrooms[0].name} (${data.topClassrooms[0].count}×)` : 'Žádná data';
    const topReason = data.topReasons[0] ? `${data.topReasons[0].name} (${data.topReasons[0].count}×)` : 'Žádná data';

    return {
      totalAbsences,
      topSubject,
      topClassroom,
      topReason,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header bar with filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Analytika a trendy výuky</h2>
            <p className="text-xs text-slate-500">
              Přehled vývoje absencí v čase a žebříčky nejvíce zatížených předmětů a tříd
            </p>
          </div>
        </div>

        {/* Scope selector: Celé období vs Vybrané období */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setScopeMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scopeMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Celý školní rok
            </button>
            <button
              type="button"
              onClick={() => setScopeMode('range')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scopeMode === 'range'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={activeRange ? `${activeRange.label || ''}` : ''}
            >
              Filtrované období
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Celkem absencí */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Celkem absencí</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {kpis.totalAbsences}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Zaznamenaných v databázi</p>
        </div>

        {/* KPI 2: Nejčastější důvod */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hlavní důvod absence</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 truncate" title={kpis.topReason}>
            {kpis.topReason}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Nejvíce omluvených dnů</p>
        </div>

        {/* KPI 3: Nejčastěji suplovaný předmět */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nejvíce suplovaný předmět</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-indigo-900 truncate" title={kpis.topSubject}>
            {kpis.topSubject}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Kde výuka trpí nejvíce</p>
        </div>

        {/* KPI 4: Nejvíce zasažená třída */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nejvíce suplovaná třída</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-cyan-950 truncate" title={kpis.topClassroom}>
            {kpis.topClassroom}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Třída / učebna s nejvíce zásahy</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-200 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Generuji analytické grafy a trendy...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 text-sm text-center">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: LineChart - Trend absencí a nemocnosti */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Vývoj absencí a nemocnosti v průběhu roku
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    LineChart
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Časová osa absencí pedagogického sboru s vyčleněním nemocí / Sick Days
                </p>
              </div>

              {/* Granularity Toggle */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTimelineMode('weekly')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    timelineMode === 'weekly'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Týdně
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineMode('monthly')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    timelineMode === 'monthly'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Měsíčně
                </button>
              </div>
            </div>

            {activeTimeline.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                Pro vybrané období nejsou k dispozici žádné záznamy o absencích.
              </div>
            ) : (
              <div className="w-full h-80 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={activeTimeline}
                    margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="period"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      name="Celkem absencí"
                      dataKey="total_absences"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 7, stroke: '#4f46e5', strokeWidth: 2, fill: '#ffffff' }}
                    />
                    <Line
                      type="monotone"
                      name="Nemoc / Sick Day"
                      dataKey="sickness_count"
                      stroke="#e11d48"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={{ r: 3.5, fill: '#e11d48', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 6, stroke: '#e11d48', strokeWidth: 2, fill: '#ffffff' }}
                    />
                    <Line
                      type="monotone"
                      name="Lékař"
                      dataKey="doctor_count"
                      stroke="#0284c7"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#0284c7' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* SECTION 2: Grid with BarCharts (Subjects & Classes) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart A: Top 5 Subjects */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Top 5 nejčastěji suplovaných předmětů
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Výuka
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  Předměty s nejvyšším počtem zameškaných hodin učitelů (kde výuka trpí nejvíce)
                </p>

                {data.topSubjects.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                    Žádná data o suplovaných předmětech.
                  </div>
                ) : (
                  <div className="w-full h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.topSubjects}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis
                          type="number"
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                          width={110}
                        />
                        <Tooltip content={<CustomBarTooltip unit="hodin" />} />
                        <Bar
                          dataKey="count"
                          name="Počet suplovaných hodin"
                          radius={[0, 8, 8, 0]}
                        >
                          {data.topSubjects.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={BAR_COLORS_SUBJECTS[index % BAR_COLORS_SUBJECTS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Quick Summary Badges */}
              {data.topSubjects.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                  {data.topSubjects.map((sub, i) => (
                    <span
                      key={sub.name}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-700"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BAR_COLORS_SUBJECTS[i] }} />
                      <span>{sub.name}</span>
                      <strong className="text-slate-900 font-mono">({sub.count})</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Chart B: Top 5 Classrooms / Classes */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Top 5 nejvíce zasažených tříd a učeben
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                    Třídy / Místnosti
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  Místa a ročníky s nejčastější potřebou dohledu a zásahu suplujících pedagogů
                </p>

                {data.topClassrooms.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                    Žádná data o třídách a učebnách.
                  </div>
                ) : (
                  <div className="w-full h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.topClassrooms}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis
                          type="number"
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                          width={110}
                        />
                        <Tooltip content={<CustomBarTooltip unit="záznamů" />} />
                        <Bar
                          dataKey="count"
                          name="Počet záznamů"
                          radius={[0, 8, 8, 0]}
                        >
                          {data.topClassrooms.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={BAR_COLORS_CLASSES[index % BAR_COLORS_CLASSES.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Quick Summary Badges */}
              {data.topClassrooms.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                  {data.topClassrooms.map((cls, i) => (
                    <span
                      key={cls.name}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-700"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BAR_COLORS_CLASSES[i] }} />
                      <span>{cls.name}</span>
                      <strong className="text-slate-900 font-mono">({cls.count})</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
