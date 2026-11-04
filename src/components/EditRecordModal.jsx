import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Clock, ShieldAlert, BookOpen, MapPin, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { formatIsoToCzech } from '../utils/dateUtils';

export default function EditRecordModal({ record, onSave, onClose }) {
  const [type, setType] = useState('HODINA');
  const [hourSlot, setHourSlot] = useState('');
  const [subject, setSubject] = useState('');
  const [classroom, setClassroom] = useState('');
  const [originalTeacher, setOriginalTeacher] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [date, setDate] = useState('');
  const [isReplacement, setIsReplacement] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (record) {
      setType(record.type === 'DOZOR' ? 'DOZOR' : 'HODINA');
      setHourSlot(record.hour_slot || '');
      setSubject(record.subject || '');
      setClassroom(record.classroom || '');
      setOriginalTeacher(record.original_teacher || '');
      setTeacherName(record.teacher_name || '');
      setDate(record.date || '');
      setIsReplacement(Number(record.is_replacement) === 1);
    }
  }, [record]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!teacherName.trim()) {
      setError('Zadejte prosím jméno suplujícího pedagoga.');
      return;
    }

    try {
      setSaving(true);
      await onSave(record.id, {
        type,
        hour_slot: hourSlot.trim() || null,
        subject: subject.trim() || null,
        classroom: classroom.trim() || null,
        original_teacher: originalTeacher.trim() || null,
        teacher_name: teacherName.trim(),
        date,
        is_replacement: type === 'HODINA' ? (isReplacement ? 1 : 0) : 0,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Chyba při ukládání záznamu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                type === 'DOZOR' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {type === 'DOZOR' ? <ShieldAlert className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upravit záznam suplování / dozoru</h3>
              <p className="text-xs text-slate-500">Úprava podrobností o hodině, učebně nebo typu aktivity</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Activity Type Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Typ aktivity
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('HODINA')}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                  type === 'HODINA'
                    ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Suplovaná hodina</span>
              </button>

              <button
                type="button"
                onClick={() => setType('DOZOR')}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                  type === 'DOZOR'
                    ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Dozor / Dohled</span>
              </button>
            </div>
          </div>

          {/* Replacement Hour Toggle (Checkbox) */}
          {type === 'HODINA' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3 animate-fade-in">
              <input
                id="is_replacement_checkbox"
                type="checkbox"
                checked={isReplacement}
                onChange={(e) => setIsReplacement(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
              />
              <label htmlFor="is_replacement_checkbox" className="text-xs text-slate-700 cursor-pointer select-none">
                <span className="font-bold block text-slate-900 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
                  Označit jako náhradní hodinu
                </span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Nezapočítává se do statistik zátěže suplování ani čárek (např. odučení vlastní odpadlé hodiny v jiném čase).
                </span>
              </label>
            </div>
          )}

          {/* Suplující učitel and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Suplující pedagog
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  required
                  placeholder="Např. Mgr. Novák Jan"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Datum
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Hour slot and Classroom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hodina / Časový slot
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Např. 1., 2, 3/4, Přestávka"
                  value={hourSlot}
                  onChange={(e) => setHourSlot(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Učebna / Místo
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Např. U14, Jídelna, Šatny"
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Subject and Original teacher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Předmět / Náplň
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Např. Matematika, Dohled"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Zastupovaný učitel
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Chybějící vyučující"
                  value={originalTeacher}
                  onChange={(e) => setOriginalTeacher(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Ukládám...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Uložit změny</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
