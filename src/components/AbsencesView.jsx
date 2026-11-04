import React, { useState, useMemo } from 'react';
import { 
  UserX, 
  Users, 
  HeartPulse, 
  Stethoscope, 
  GraduationCap, 
  Search, 
  Filter, 
  Baby, 
  Briefcase, 
  AlertTriangle,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { formatIsoToCzech } from '../utils/dateUtils';
import EditAbsenceModal from './EditAbsenceModal';
import TeacherAbsencesModal from './TeacherAbsencesModal';
import { updateAbsence, deleteAbsence } from '../services/api';

/**
 * Returns icon and badge styling for common Czech absence reasons
 */
export function getReasonBadgeStyle(reason = '') {
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
  const [selectedTeacherName, setSelectedTeacherName] = useState(null); // for detail modal
  const [editingAbsence, setEditingAbsence] = useState(null);
  const [deletingAbsence, setDeletingAbsence] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const byReason = absenceSummary.byReason || [];
  const totalAbsences = absences.length;

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

  // Selected teacher object for modal (kept in sync)
  const activeTeacherForModal = useMemo(() => {
    if (!selectedTeacherName) return null;
    return groupedTeachers.find((t) => t.teacher_name === selectedTeacherName) || null;
  }, [groupedTeachers, selectedTeacherName]);

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
            <p className="text-2xl font-black text-blue-900 mt-0.5">{groupedTeachers.length}</p>
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
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
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

      {/* 2. Kompaktní mřížka dlaždic učitelů (4 až 6 vedle sebe) */}
      <div className="space-y-4">
        {/* Controls Bar: Search */}
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
          /* Responsive Grid: 2 cols on mobile, 3 sm, 4 md, 6 xl */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {groupedTeachers.map((teacher) => (
              <div
                key={teacher.teacher_name}
                onClick={() => setSelectedTeacherName(teacher.teacher_name)}
                className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-brand-400 hover:scale-[1.015] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between group"
              >
                {/* Top: Avatar & Count Badge */}
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 group-hover:from-brand-600 group-hover:to-purple-600 transition-colors">
                      {teacher.teacher_name.charAt(0)}
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 shrink-0">
                      {teacher.totalCount}×
                    </span>
                  </div>

                  {/* Teacher Name */}
                  <h4
                    className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors leading-tight"
                    title={teacher.teacher_name}
                  >
                    {teacher.teacher_name}
                  </h4>
                </div>

                {/* Bottom: Compact Reason Tags */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1">
                  {Object.entries(teacher.reasonCounts).map(([reason, count]) => {
                    const badgeStyle = getReasonBadgeStyle(reason);
                    return (
                      <span
                        key={reason}
                        title={`${reason}: ${count}×`}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border truncate max-w-full ${badgeStyle.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeStyle.dot}`} />
                        <span className="truncate">{reason}</span>
                        {count > 1 && <span className="font-bold shrink-0">{count}×</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teacher Absences Detail Modal */}
      {activeTeacherForModal && (
        <TeacherAbsencesModal
          teacher={activeTeacherForModal}
          onClose={() => setSelectedTeacherName(null)}
          onEditAbsence={(item) => setEditingAbsence(item)}
          onDeleteAbsence={(item) => setDeletingAbsence(item)}
          getReasonBadgeStyle={getReasonBadgeStyle}
        />
      )}

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
