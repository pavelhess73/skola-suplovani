import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  User, 
  MapPin, 
  BookOpen, 
  AlertCircle,
  Pencil,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { formatIsoToCzech } from '../utils/dateUtils';
import EditRecordModal from './EditRecordModal';
import { updateSubstitutionRecord, deleteSubstitutionRecord } from '../services/api';

export default function TeacherDetailModal({ teacherName, records, onClose, onRecordUpdated }) {
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  // Close on Escape key if no inner modal is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !editingRecord && !deletingRecord) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, editingRecord, deletingRecord]);

  if (!teacherName) return null;

  const teacherRecords = records.filter((r) => r.teacher_name === teacherName);
  const hoursCount = teacherRecords.filter((r) => r.type === 'HODINA').length;
  const dutiesCount = teacherRecords.filter((r) => r.type === 'DOZOR').length;

  const handleSaveEdit = async (id, updatedFields) => {
    const res = await updateSubstitutionRecord(id, updatedFields);
    setActionNotice({
      type: 'success',
      text: res.message || 'Záznam byl úspěšně upraven.',
    });
    setTimeout(() => setActionNotice(null), 3500);
    if (onRecordUpdated) onRecordUpdated();
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    try {
      setIsDeleting(true);
      await deleteSubstitutionRecord(deletingRecord.id);
      setActionNotice({
        type: 'success',
        text: 'Záznam suplování/dozoru byl smazán.',
      });
      setTimeout(() => setActionNotice(null), 3500);
      setDeletingRecord(null);
      if (onRecordUpdated) onRecordUpdated();
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
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
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
        <div className="px-6 py-3.5 bg-brand-50/60 border-b border-brand-100/60 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex flex-wrap items-center gap-3">
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

          {actionNotice && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${
                actionNotice.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span>{actionNotice.text}</span>
            </div>
          )}
        </div>

        {/* Modal Body / Record List */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-3 flex-1">
          {teacherRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>Pro tohoto vyučujícího nebyly v daném období nalezeny žádné záznamy.</p>
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
                    <th className="py-2.5 px-3 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teacherRecords.map((r, i) => (
                    <tr key={r.id || i} className="hover:bg-slate-50/60 transition-colors">
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
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingRecord(r)}
                            title="Upravit záznam"
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingRecord(r)}
                            title="Smazat záznam"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
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

      {/* Edit Record Modal */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onSave={handleSaveEdit}
          onClose={() => setEditingRecord(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Smazat záznam?</h3>
              <p className="text-sm text-slate-500">
                Opravdu chcete smazat {deletingRecord.type === 'DOZOR' ? 'dozor' : 'hodinu suplování'} pro vyučujícího{' '}
                <strong className="text-slate-800">{deletingRecord.teacher_name}</strong> ze dne{' '}
                <strong className="text-slate-800">{formatIsoToCzech(deletingRecord.date)}</strong>{' '}
                ({deletingRecord.subject || deletingRecord.hour_slot || ''})?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
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
