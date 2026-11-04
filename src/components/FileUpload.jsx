import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Users, 
  Clock, 
  ShieldAlert, 
  ArrowRight, 
  X, 
  FileText,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseEdupageExcel } from '../utils/edupageParser';
import { uploadRecords } from '../services/api';

export default function FileUpload({ onUploadSuccess, onNavigateToStats }) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    setError(null);
    setSuccessInfo(null);
    setParsedData(null);

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Vyberte prosím soubor ve formátu Excel (.xlsx nebo .xls).');
      return;
    }

    try {
      setParsing(true);
      const buffer = await file.arrayBuffer();
      const result = await parseEdupageExcel(buffer);

      if (!result.records || result.records.length === 0) {
        setError(`V souboru pro datum ${result.dateFormatted} nebyly nalezeny žádné záznamy se suplujícím učitelem.`);
        setParsing(false);
        return;
      }

      setParsedData({
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        ...result,
      });
    } catch (err) {
      console.error('Parsing error:', err);
      setError(err.message || 'Nepodařilo se zpracovat soubor z EduPage.');
    } finally {
      setParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Generate sample EduPage Excel to test immediately
  const handleGenerateSampleFile = async () => {
    setError(null);
    setSuccessInfo(null);
    setParsing(true);

    try {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();

      // Typical EduPage sheet format:
      // Row 1: Header title with Date
      // Row 4: Column names
      // Rows 5+: records
      const sampleData = [
        [`Suplování: Středa ${day}. ${month}. ${year}`],
        ['Gymnázium a Střední odborná škola'],
        [''],
        ['Hodina', 'Třída', 'Předmět', 'Učebna', 'Chybějící', 'Suplující', 'Typ'],
        ['1.', '1.A', 'Matematika', 'U10', 'Novák Jan', 'Svoboda Petr', 'Suplování'],
        ['2.', '2.B', 'Fyzika', 'LAB-FYZ', 'Dvořáková Eva', 'Svoboda Petr', 'Suplování'],
        ['3.', '3.A', 'Dohled - chodba', '1. patro', 'Novák Jan', 'Svoboda Petr', 'Dohled'],
        ['3.', '4.B', 'Anglický jazyk', 'U14', 'Horák Tomáš', 'Černá Marie', 'Suplování'],
        ['4.', 'Přízemí', 'Dohled - jídelna', 'Jídelna', 'Kovář Pavel', 'Černá Marie', 'Dohled'],
        ['4.', '1.B', 'Český jazyk', 'U02', 'Veselá Lucie', 'Kučera Martin', 'Zástup'],
        ['5.', '2.A', 'Dějepis', 'U05', 'Novák Jan', 'Kučera Martin', 'Suplování'],
        ['Přestávka', 'Dvůr', 'Dohled - areál', 'Dvůr', 'Horák Tomáš', 'Černá Marie', 'Dohled'],
      ];

      const ws = XLSX.utils.aoa_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Suplování');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const result = await parseEdupageExcel(wbout);
      setParsedData({
        fileName: `edupage-suplovani-ukazka-${year}-${month}-${day}.xlsx`,
        fileSize: '8.4 KB',
        ...result,
      });
    } catch (err) {
      setError(err.message || 'Nepodařilo se vygenerovat ukázkový soubor.');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!parsedData) return;

    try {
      setSaving(true);
      setError(null);
      const res = await uploadRecords(parsedData.date, parsedData.records);

      setSuccessInfo({
        date: parsedData.dateFormatted,
        count: parsedData.records.length,
        message: res.message,
      });

      if (onUploadSuccess) {
        onUploadSuccess(parsedData.date);
      }
      setParsedData(null);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Chyba při ukládání do databáze.');
    } finally {
      setSaving(false);
    }
  };

  const hoursCount = parsedData ? parsedData.records.filter((r) => r.type === 'HODINA').length : 0;
  const dutiesCount = parsedData ? parsedData.records.filter((r) => r.type === 'DOZOR').length : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Introduction Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Nahrání exportu z EduPage</h2>
            <p className="text-sm text-slate-500 mt-1">
              Přetáhněte vygenerovaný Excel (.xlsx) s denním rozpisem suplování a dozorů.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateSampleFile}
            disabled={parsing || saving}
            className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-200/80 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Vygenerovat vzorový EduPage soubor</span>
          </button>
        </div>

        {/* Drag & Drop Zone */}
        {!parsedData && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-6 border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50 scale-[1.005]'
                : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50/70'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-4 shadow-sm">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-base font-medium text-slate-900">
                Přetáhněte sem soubor nebo <span className="text-brand-600 underline">vyberte z disku</span>
              </p>
              <p className="text-xs text-slate-500 mt-1.5">Podporován formát Microsoft Excel (.xlsx, .xls) z EduPage</p>
            </div>
          </div>
        )}

        {/* Parsing Indicator */}
        {parsing && (
          <div className="mt-4 p-4 rounded-xl bg-brand-50 border border-brand-100 flex items-center gap-3 text-brand-800 text-sm">
            <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span>Zpracovávám sešit a extrahuji datum a rozpis...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Chyba při zpracování souboru</p>
              <p className="text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successInfo && (
          <div className="mt-4 p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-base text-emerald-950">Záznamy úspěšně uloženy do databáze</h3>
                <p className="text-sm text-emerald-800 mt-1">
                  Pro datum <strong>{successInfo.date}</strong> bylo v databázi Cloudflare D1 aktualizováno{' '}
                  <strong>{successInfo.count} záznamů</strong>. Staré záznamy pro tento den byly přepsány.
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessInfo(null);
                      if (onNavigateToStats) onNavigateToStats();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    <span>Zobrazit přehled statistik</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuccessInfo(null)}
                    className="px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-800 text-sm font-medium rounded-lg border border-emerald-300 transition-colors"
                  >
                    Nahrát další den
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Immediate Parsed Data Preview & Confirmation */}
      {parsedData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">{parsedData.fileName}</h3>
                <span className="text-xs text-slate-500">({parsedData.fileSize})</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                <span className="flex items-center gap-1.5 font-medium text-slate-900">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  Datum: {parsedData.dateFormatted}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  {hoursCount} hodin suplování
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  {dutiesCount} dozorů
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setParsedData(null)}
                disabled={saving}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-brand-600/20 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Ukládám do D1...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Potvrdit a uložit do databáze</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="px-6 py-3 bg-amber-50/70 border-b border-amber-100/60 text-xs text-amber-800 flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[10px] bg-amber-200/70 px-1.5 py-0.5 rounded">
              Upozornění
            </span>
            <span>
              Pokud pro datum <strong>{parsedData.dateFormatted}</strong> již existují záznamy, budou v databázi bezpečně nahrazeny tímto novým importem.
            </span>
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold tracking-wider sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Typ</th>
                  <th className="py-3 px-4">Suplující učitel</th>
                  <th className="py-3 px-4">Hodina / Čas</th>
                  <th className="py-3 px-4">Předmět / Popis</th>
                  <th className="py-3 px-4">Učebna</th>
                  <th className="py-3 px-4">Chybějící vyučující</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedData.records.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {r.type === 'DOZOR' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          DOZOR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" />
                          HODINA
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{r.teacher_name}</td>
                    <td className="py-2.5 px-4 text-slate-600">{r.hour_slot || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-700">{r.subject || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-600">{r.classroom || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-500 italic">{r.original_teacher || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

