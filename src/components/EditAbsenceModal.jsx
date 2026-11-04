import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Clock, HeartPulse, Save, AlertCircle } from 'lucide-react';
import { formatIsoToCzech } from '../utils/dateUtils';

const REASON_PRESETS = [
  'Návštěva lékaře',
  'Sick Day',
  'Školení',
  'OČR',
  'Neplacené volno',
  'Jiné',
];

export default function EditAbsenceModal({ absence, onSave, onClose }) {
  const [reasonPreset, setReasonPreset] = useState('Návštěva lékaře');
  const [customReason, setCustomReason] = useState('');
  const [timeRange, setTimeRange] = useState('Celý den');
  const [teacherName, setTeacherName] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (absence) {
      setTeacherName(absence.teacher_name || '');
      setDate(absence.date || '');
      setTimeRange(absence.time_range || 'Celý den');

      // Check if reason is one of the presets
      const matched = REASON_PRESETS.find(
        (p) => p.toLowerCase() === (absence.reason || '').toLowerCase()
      );

      if (matched && matched !== 'Jiné') {
        setReasonPreset(matched);
        setCustomReason('');
      } else if (absence.reason) {
        setReasonPreset('Jiné');
        setCustomReason(absence.reason);
      } else {
        setReasonPreset('Sick Day');
        setCustomReason('');
      }
    }
  }, [absence]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!absence) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const finalReason = reasonPreset === 'Jiné' ? customReason.trim() : reasonPreset;
    if (!finalReason) {
      setError('Zadejte prosím důvod absence.');
      return;
    }

    try {
      setSaving(true);
      await onSave(absence.id, {
        teacher_name: teacherName.trim(),
        date,
        reason: finalReason,
        time_range: timeRange.trim() || 'Celý den',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Chyba při ukládání změn.');
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
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upravit záznam absence</h3>
              <p className="text-xs text-slate-500">Úprava důvodu nebo rozsahu pro vyučujícího</p>
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

          {/* Teacher and Date (Informative & customizable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vyučující
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
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

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Důvod absence
            </label>
            <select
              value={reasonPreset}
              onChange={(e) => setReasonPreset(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-900 font-medium"
            >
              {REASON_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason input if "Jiné" is chosen */}
          {reasonPreset === 'Jiné' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Vlastní název důvodu
              </label>
              <input
                type="text"
                placeholder="Např. Odborný seminář, Doprovod k lékaři..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                autoFocus
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
              />
            </div>
          )}

          {/* Time range */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Kdy / Rozsah absence
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Např. Celý den, 1 - 3, od 11:30"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Příklady: "Celý den", "1 - 3" (hodiny), "od 4. hodiny"
            </p>
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

