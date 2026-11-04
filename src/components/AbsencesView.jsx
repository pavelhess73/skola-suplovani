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
  Clock,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers
} from 'lucide-react';
import { formatIsoToCzech } from '../utils/dateUtils';
import EditAbsenceModal from './EditAbsenceModal';
import { updateAbsence, deleteAbsence } from '../services/api';

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
  if (norm.includes('dovolená') || norm.includes('dovolena') || norm.includes('volno')) {
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

export default function AbsencesView({ absences = [], absenceSummary = {}, onAbsenceUpdated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReason, setSelectedReason] = useState('ALL'); // 'ALL' or specific reason
  const [expandedTeachers, setExpandedTeachers] = useState({}); // { [teacherName]: boolean }
  const [editingAbsence, setEditingAbsence] = useState(null);
  const [deletingAbsence, setDeletingAbsence] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const byReason = absenceSummary.byReason || [];
  const totalAbsences = absences.length;

  // Toggle expanding a single teacher card
  const toggleTeacher = (teacherName) => {
    setExpandedTeachers((prev) => ({
      ...prev,
      [teacherName]: !prev[teacherName],
    }));
  };

  // Group absences by teacher
  const groupedTeachers = useMemo(() => {
    const map = {};

    absences.forEach((record) => {
      const name = record.teacher_name;
      if (!map[name]) {
        map[name] = {
          teacher_name: name,
          absences: [],
          reasonCounts: {},
          totalCount: 0,
        };
      }
      map[name].absences.push(record);
      map[name].totalCount += 1;
      map[name].reasonCounts[record.reason] = (map[name].reasonCounts[record.reason] || 0) + 1;
    });

    let list = Object.values(map);

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((t) => t.teacher_name.toLowerCase().includes(term));
    }

    // Filter by active reason tile
    if (selectedReason !== 'ALL') {
      list = list.filter((t) => !!t.reasonCounts[selectedReason]);
    }

    // Sort: most absences first, then by name
    list.sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.teacher_name.localeCompare(b.teacher_name, 'cs');
    });

    return list;
  }, [absences, searchTerm, selectedReason]);

  // Expand / collapse all toggle
  const allExpanded = useMemo(() => {
    if (groupedTeachers.length === 0) return false;
    return groupedTeachers.every((t) => !!expandedTeachers[t.teacher_name]);
  }, [groupedTeachers, expandedTeachers]);

  const toggleAll = () => {
    const nextState = !allExpanded;
    const update = {};
    groupedTeachers.forEach((t) => {
      update[t.teacher_name] = nextState;
    });
    setExpandedTeachers(update);
  };

  // Top reason
  const topReason = byReason.length > 0 ? byReason[0].reason : '-';

  // Handle Save Edit
  const handleSaveEdit = async (id, updatedFields) => {
    const res = await updateAbsence(id, updatedFields);
    setActionNotice({
      type: 'success',
      text: res.message || 'Záznam byl úspěšně upraven.',
    });
    setTimeout(() => setActionNotice(null), 3500);
    if (onAbsenceUpdated) onAbsenceUpdated();
  };

  // Handle Delete Record
  const handleConfirmDelete = async () => {
    if (!deletingAbsence) return;
    try {
      setIsDeleting(true);
      await deleteAbsence(deletingAbsence.id);
      setActionNotice({
        type: 'success',
        text: `Záznam absence pro ${deletingAbsence.teacher_name} byl smazán.`,
      });
      setTimeout(() => setActionNotice(null), 3500);
      setDeletingAbsence(null);
      if (onAbsenceUpdated) onAbsenceUpdated();
    } catch (err) {
      setActionNotice({
        type: 'error',
        text: err.message || 'Chyba při mazání záznamu.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notice Toast */}
      {actionNotice && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2.5 text-sm animate-fade-in ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
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
            <p className="text-2xl font-black text-blue-900 mt-0.5">{Object.keys(groupedTeachers).length}</p>
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

      {/* 1. Horní souhrnné dlaždice důvodů jako aktivní filtr */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Filtrovat podle důvodu absence:
            </h3>
            <span className="text-xs text-slate-500 hidden sm:inline">
              (kliknutím zapnete/vypnete filtr)
            </span>
          </div>
          {selectedReason !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedReason('ALL')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 self-start sm:self-auto bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200/80 transition-colors"
            >
              ✕ Zrušit filtr ({selectedReason})
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
                <button
                  type="button"
                  key={item.reason}
                  onClick={() => setSelectedReason(isSelected ? 'ALL' : item.reason)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/70 shadow-sm ring-2 ring-brand-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-slate-900 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                      <Icon className="w-4 h-4 text-slate-600 shrink-0" />
                      <span className="truncate" title={item.reason}>{item.reason}</span>
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      {item.count}×
                    </span>
                  </div>

                  {/* Visual percentage bar */}
                  <div className="mt-2.5">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          isSelected ? 'bg-brand-600' : 'bg-brand-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">
                      {percent}% z celku
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. & 3. Mřížka karet učitelů s rozklikávacím akordeonem */}
      <div className="space-y-4">
        {/* Controls Bar: Search & Expand All */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">
              Přehled chybějících pedagogů
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {groupedTeachers.length} vyučujících
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Hledat učitele..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            {/* Expand / Collapse all button */}
            {groupedTeachers.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{allExpanded ? 'Sbalit vše' : 'Rozbalit vše'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {groupedTeachers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400">
            <UserX className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">
              {absences.length === 0
                ? 'Pro vybrané období nebyly nalezeny žádné záznamy o absencích.'
                : 'Žádný vyučující neodpovídá zvolenému filtru nebo hledání.'}
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 gap-3.5">
            {groupedTeachers.map((teacher) => {
              const isExpanded = !!expandedTeachers[teacher.teacher_name];

              return (
                <div
                  key={teacher.teacher_name}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    isExpanded
                      ? 'border-brand-300 shadow-md ring-1 ring-brand-500/20'
                      : 'border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Card Header (Clickable Accordion Trigger) */}
                  <div
                    onClick={() => toggleTeacher(teacher.teacher_name)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer select-none bg-white hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Left: Avatar & Teacher Name */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                        {teacher.teacher_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-slate-900 tracking-tight">
                            {teacher.teacher_name}
                          </h4>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            {teacher.totalCount}{' '}
                            {teacher.totalCount === 1
                              ? 'absence'
                              : teacher.totalCount < 5
                              ? 'absence'
                              : 'absencí'}
                          </span>
                        </div>

                        {/* Badges of reasons with counts */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {Object.entries(teacher.reasonCounts).map(([reason, count]) => {
                            const badgeStyle = getReasonBadgeStyle(reason);
                            const Icon = badgeStyle.icon;

                            return (
                              <span
                                key={reason}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle.bg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                                <Icon className="w-3 h-3" />
                                <span>{reason}</span>
                                <span className="font-bold ml-0.5">{count}×</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Expand / Collapse Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 sm:hidden">
                        {isExpanded ? 'Skrýt podrobnosti' : 'Zobrazit podrobnosti'}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 ${
                          isExpanded
                            ? 'bg-brand-100 text-brand-700 rotate-180'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Accordion Detail: List of Individual Absences */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5 space-y-2.5 animate-fade-in">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Rozpis jednotlivých absencí v období:
                      </div>

                      <div className="space-y-2">
                        {teacher.absences.map((item) => {
                          const badgeStyle = getReasonBadgeStyle(item.reason);
                          const Icon = badgeStyle.icon;

                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-slate-300 transition-colors"
                            >
                              {/* Date & Time range */}
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                                  <Calendar className="w-4 h-4 text-brand-600" />
                                  {formatIsoToCzech(item.date)}
                                </span>

                                <span className="text-slate-300 hidden sm:inline">•</span>

                                <span className="inline-flex items-center gap-1 text-slate-600 text-xs sm:text-sm">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  Rozsah: <strong className="text-slate-800 ml-1">{item.time_range}</strong>
                                </span>
                              </div>

                              {/* Reason Badge & Actions */}
                              <div className="flex items-center justify-between sm:justify-end gap-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle.bg}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                                  <Icon className="w-3.5 h-3.5" />
                                  <span>{item.reason}</span>
                                </span>

                                {/* Action buttons: Edit & Delete */}
                                <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                                  <button
                                    type="button"
                                    onClick={() => setEditingAbsence(item)}
                                    title="Upravit záznam absence"
                                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingAbsence(item)}
                                    title="Smazat záznam absence"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal Dialog */}
      {editingAbsence && (
        <EditAbsenceModal
          absence={editingAbsence}
          onSave={handleSaveEdit}
          onClose={() => setEditingAbsence(null)}
        />
      )}

      {/* Quick Deletion Confirmation Dialog */}
      {deletingAbsence && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Smazat záznam absence?</h3>
              <p className="text-sm text-slate-500">
                Opravdu chcete smazat záznam pro vyučujícího{' '}
                <strong className="text-slate-800">{deletingAbsence.teacher_name}</strong> ze dne{' '}
                <strong className="text-slate-800">{formatIsoToCzech(deletingAbsence.date)}</strong>?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingAbsence(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mažu...</span>
                  </>
                ) : (
                  <span>Ano, smazat</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
