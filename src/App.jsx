import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import PeriodSelector from './components/PeriodSelector';
import StatsTable from './components/StatsTable';
import AbsencesView from './components/AbsencesView';
import FileUpload from './components/FileUpload';
import TeacherDetailModal from './components/TeacherDetailModal';
import LoginScreen from './components/LoginScreen';
import { fetchStats, getAuthToken, clearAuthToken } from './services/api';
import { getThisWeekRange } from './utils/dateUtils';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAuthToken());
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'absences' | 'upload'
  const [activeRange, setActiveRange] = useState(getThisWeekRange());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    summary: [],
    records: [],
    absences: [],
    absenceSummary: {
      totalAbsences: 0,
      byReason: [],
      byTeacher: [],
    },
    totals: {
      teachersCount: 0,
      totalHours: 0,
      totalDuties: 0,
      grandTotal: 0,
      totalAbsences: 0,
    },
    isLocalFallback: false,
  });

  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Load stats from API
  const loadStats = useCallback(
    async (rangeToFetch) => {
      const range = rangeToFetch || activeRange;
      if (!range || !range.startDate || !range.endDate) return;

      try {
        setLoading(true);
        setError(null);
        const res = await fetchStats(range.startDate, range.endDate);
        if (res.success) {
          setData({
            summary: res.summary || [],
            records: res.records || [],
            absences: res.absences || [],
            absenceSummary: res.absenceSummary || {
              totalAbsences: 0,
              byReason: [],
              byTeacher: [],
            },
            totals: res.totals || {
              teachersCount: 0,
              totalHours: 0,
              totalDuties: 0,
              grandTotal: 0,
              totalAbsences: 0,
            },
            isLocalFallback: !!res.isLocalFallback,
          });
        } else {
          setError(res.error || 'Nepodařilo se načíst statistiky.');
        }
      } catch (err) {
        if (err.isAuthError) {
          setIsAuthenticated(false);
          return;
        }
        setError(err.message || 'Chyba při komunikaci se serverem.');
      } finally {
        setLoading(false);
      }
    },
    [activeRange]
  );

  // Trigger load whenever activeRange changes and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadStats(activeRange);
    }
  }, [isAuthenticated, activeRange, loadStats]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    setSelectedTeacher(null);
  };

  const handleRangeChange = (newRange) => {
    setActiveRange(newRange);
  };

  const handleUploadSuccess = () => {
    loadStats();
  };

  // If user is not authenticated, show login screen
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={() => loadStats()}
        onLogout={handleLogout}
        loading={loading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Local Storage / Demo Mode Banner (only shown if backend is in fallback) */}
        {data.isLocalFallback && (
          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-800 flex items-center justify-between">
            <span>
              💡 <strong>Lokální režim:</strong> Běží s ukázkovými daty a lokálním úložištěm prohlížeče. Pro Cloudflare D1 spusťte{' '}
              <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">npm run pages:dev</code>.
            </span>
          </div>
        )}

        {/* Period Selector (shared for Stats and Absences) */}
        {(activeTab === 'stats' || activeTab === 'absences') && (
          <PeriodSelector
            activeRange={activeRange}
            onRangeChange={handleRangeChange}
          />
        )}

        {/* Tab 1: Stats (Suplování & Dozory) */}
        {activeTab === 'stats' && (
          <div>
            {loading ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
                <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">Načítám statistiky z databáze...</p>
              </div>
            ) : (
              <StatsTable
                summary={data.summary}
                records={data.records}
                totals={data.totals}
                onSelectTeacher={(teacher) => setSelectedTeacher(teacher)}
              />
            )}
          </div>
        )}

        {/* Tab 2: Absences (Chybějící) */}
        {activeTab === 'absences' && (
          <div>
            {loading ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">Načítám přehled absencí...</p>
              </div>
            ) : (
              <AbsencesView
                absences={data.absences}
                absenceSummary={data.absenceSummary}
                activeRange={activeRange}
                onAbsenceUpdated={() => loadStats()}
              />
            )}
          </div>
        )}

        {/* Tab 3: Upload */}
        {activeTab === 'upload' && (
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onNavigateToStats={() => setActiveTab('stats')}
          />
        )}
      </main>

      {/* Teacher Detail Modal */}
      {selectedTeacher && (
        <TeacherDetailModal
          teacherName={selectedTeacher}
          records={data.records}
          onClose={() => setSelectedTeacher(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          Evidence suplování a dozorů • Chráněno heslem • Vite, React, Cloudflare Pages & D1
        </div>
      </footer>
    </div>
  );
}
