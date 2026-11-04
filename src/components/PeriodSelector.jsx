import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight, Filter } from 'lucide-react';
import { 
  getThisWeekRange, 
  getThisMonthRange, 
  getSchoolYearRange, 
  formatIsoToCzech 
} from '../utils/dateUtils';

export default function PeriodSelector({ activeRange, onRangeChange }) {
  const [selectedPreset, setSelectedPreset] = useState('week'); // 'week' | 'month' | 'year' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Initial setup
  useEffect(() => {
    applyPreset('week');
  }, []);

  const applyPreset = (preset) => {
    setSelectedPreset(preset);
    let range;
    if (preset === 'week') {
      range = getThisWeekRange();
    } else if (preset === 'month') {
      range = getThisMonthRange();
    } else if (preset === 'year') {
      range = getSchoolYearRange();
    }

    if (range) {
      setCustomStart(range.startDate);
      setCustomEnd(range.endDate);
      onRangeChange(range);
    }
  };

  const handleCustomStartChange = (e) => {
    const val = e.target.value;
    setCustomStart(val);
    if (val && customEnd) {
      onRangeChange({
        startDate: val,
        endDate: customEnd,
        label: `Od ${formatIsoToCzech(val)} do ${formatIsoToCzech(customEnd)}`,
      });
    }
  };

  const handleCustomEndChange = (e) => {
    const val = e.target.value;
    setCustomEnd(val);
    if (customStart && val) {
      onRangeChange({
        startDate: customStart,
        endDate: val,
        label: `Od ${formatIsoToCzech(customStart)} do ${formatIsoToCzech(val)}`,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Preset button group */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Období:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('week')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              selectedPreset === 'week'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tento týden (Po–Pá)
          </button>

          <button
            type="button"
            onClick={() => applyPreset('month')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              selectedPreset === 'month'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tento měsíc
          </button>

          <button
            type="button"
            onClick={() => applyPreset('year')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              selectedPreset === 'year'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Školní rok
          </button>

          <button
            type="button"
            onClick={() => setSelectedPreset('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              selectedPreset === 'custom'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Vlastní rozsah
          </button>
        </div>

        {/* Current range badge */}
        {activeRange && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl self-start lg:self-center">
            <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="font-medium text-slate-900">
              {formatIsoToCzech(activeRange.startDate)} – {formatIsoToCzech(activeRange.endDate)}
            </span>
            <span className="text-slate-400 font-mono text-xs hidden sm:inline">
              ({activeRange.label})
            </span>
          </div>
        )}
      </div>

      {/* Custom Date Inputs (when 'custom' preset is active) */}
      {selectedPreset === 'custom' && (
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="custom-start" className="text-xs font-semibold text-slate-600">
              Od:
            </label>
            <input
              id="custom-start"
              type="date"
              value={customStart}
              onChange={handleCustomStartChange}
              className="text-xs sm:text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-2xs"
            />
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />

          <div className="flex items-center gap-2">
            <label htmlFor="custom-end" className="text-xs font-semibold text-slate-600">
              Do:
            </label>
            <input
              id="custom-end"
              type="date"
              value={customEnd}
              onChange={handleCustomEndChange}
              className="text-xs sm:text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-2xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}

