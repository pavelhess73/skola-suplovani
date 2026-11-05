import React from 'react';
import { CalendarClock, BarChart2, UploadCloud, RefreshCw, LogOut, UserX, TrendingUp } from 'lucide-react';

export default function Navbar({ activeTab, onTabChange, onRefresh, onLogout, loading }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">EduSuplování</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                  Cloudflare D1
                </span>
                {/* Logout button directly beside title */}
                <button
                  type="button"
                  onClick={onLogout}
                  title="Odhlásit se ze systému"
                  className="hidden sm:inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Odhlásit se</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Evidence suplování a rovnoměrnosti dozorů</p>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <nav className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => onTabChange('stats')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'stats'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <BarChart2 className="w-4 h-4 text-brand-600" />
                <span className="hidden sm:inline">Statistiky</span>
                <span className="sm:hidden">Suplování</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('absences')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'absences'
                    ? 'bg-white text-purple-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <UserX className="w-4 h-4 text-purple-600" />
                <span>Absence</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('analytics')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Analytika</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('upload')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <UploadCloud className="w-4 h-4 text-brand-600" />
                <span className="hidden sm:inline">Nahrát z EduPage</span>
                <span className="sm:hidden">Nahrát</span>
              </button>
            </nav>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Obnovit data"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
            </button>

            {/* Mobile Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              title="Odhlásit se"
              className="sm:hidden p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
