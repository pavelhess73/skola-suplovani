import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ArrowRight, Eye, EyeOff, CalendarClock } from 'lucide-react';
import { login } from '../services/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Zadejte prosím přístupové heslo.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await login(password.trim());
      if (res.success) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message || 'Nesprávné přihlašovací heslo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-brand-50/30 to-indigo-50/40 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10 space-y-8 animate-fade-in">
        {/* Header with App Logo */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <CalendarClock className="w-5 h-5 text-brand-600" />
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">EduSuplování</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Evidence suplování a rovnoměrnosti dozorů
            </p>
          </div>
        </div>

        {/* Security badge info */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 flex items-center gap-2.5">
          <KeyRound className="w-4 h-4 text-brand-600 shrink-0" />
          <span>Přístup do systému je chráněn školním heslem.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Přístupové heslo
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Zadejte heslo..."
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm shadow-xs pr-11 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs sm:text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold rounded-xl shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Ověřuji heslo...</span>
              </>
            ) : (
              <>
                <span>Vstoupit do aplikace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400">
          Chráněno Cloudflare Pages & D1
        </p>
      </div>
    </div>
  );
}

