import React, { useEffect } from 'react';
import { X, Calendar, Clock, UserX, Pencil, Trash2 } from 'lucide-react';
import { formatIsoToCzech } from '../utils/dateUtils';

export default function TeacherAbsencesModal({
  teacher,
  onClose,
  onEditAbsence,
  onDeleteAbsence,
  getReasonBadgeStyle,
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!teacher) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              {teacher.teacher_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{teacher.teacher_name}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {teacher.totalCount}{' '}
                  {teacher.totalCount === 1
                    ? 'absence'
                    : teacher.totalCount < 5
                    ? 'absence'
                    : 'absencí'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Přehled všech evidovaných absencí ve vybraném období
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason summary badges strip */}
        <div className="px-6 py-3 bg-purple-50/50 border-b border-purple-100/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Rozdělení:</span>
          {Object.entries(teacher.reasonCounts).map(([reason, count]) => {
            const badgeStyle = getReasonBadgeStyle(reason);
            const Icon = badgeStyle.icon;
            return (
              <span
                key={reason}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium border ${badgeStyle.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                <Icon className="w-3 h-3" />
                <span>{reason}</span>
                <span className="font-bold ml-0.5">{count}×</span>
              </span>
            );
          })}
        </div>

        {/* List of absences */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-2.5 flex-1">
          {teacher.absences.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <UserX className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>Nebyly nalezeny žádné záznamy o absencích.</p>
            </div>
          ) : (
            teacher.absences.map((item) => {
              const badgeStyle = getReasonBadgeStyle(item.reason);
              const Icon = badgeStyle.icon;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-slate-300 transition-colors"
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

                  {/* Reason Badge & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.reason}</span>
                    </span>

                    <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                      <button
                        type="button"
                        onClick={() => onEditAbsence(item)}
                        title="Upravit záznam absence"
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAbsence(item)}
                        title="Smazat záznam absence"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold rounded-xl transition-colors"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}

