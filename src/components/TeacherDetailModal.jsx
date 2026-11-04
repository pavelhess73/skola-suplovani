import React, { useEffect } from 'react';
import { X, Calendar, Clock, ShieldAlert, User, MapPin, BookOpen, AlertCircle } from 'lucide-react';
import { formatIsoToCzech } from '../utils/dateUtils';

export default function TeacherDetailModal({ teacherName, records, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!teacherName) return null;

  const teacherRecords = records.filter((r) => r.teacher_name === teacherName);
  const hoursCount = teacherRecords.filter((r) => r.type === 'HODINA').length;
  const dutiesCount = teacherRecords.filter((r) => r.type === 'DOZOR').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-base">
              {teacherName.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{teacherName}</h3>
              <p className="text-xs text-slate-500">Detailní rozpis evidovaného suplování a dozorů</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats summary strip */}
        <div className="px-6 py-3.5 bg-brand-50/60 border-b border-brand-100/60 flex flex-wrap items-center gap-4 text-xs font-semibold">
          <span className="text-slate-700">Celková zátěž v období:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-brand-200 text-brand-900">
            <span className="text-slate-500 font-normal">Celkem:</span> {teacherRecords.length}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100/80 border border-blue-200 text-blue-900">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-blue-700 font-normal">Hodin:</span> {hoursCount}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/80 border border-amber-200 text-amber-900">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-amber-700 font-normal">Dozorů:</span> {dutiesCount}
          </span>
        </div>

        {/* Modal Body / Record List */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-3 flex-1">
          {teacherRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>Pro tohoto učitele nebyly v daném období nalezeny žádné záznamy.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Datum</th>
                    <th className="py-2.5 px-3">Typ</th>
                    <th className="py-2.5 px-3">Hodina / Čas</th>
                    <th className="py-2.5 px-3">Předmět / Náplň</th>
                    <th className="py-2.5 px-3">Učebna</th>
                    <th className="py-2.5 px-3">Zastupovaný učitel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teacherRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-900">
                        {formatIsoToCzech(r.date)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {r.type === 'DOZOR' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            DOZOR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" />
                            HODINA
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">{r.hour_slot || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-semibold">{r.subject || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.classroom || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-500 italic">{r.original_teacher || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

