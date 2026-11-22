import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFillDemo = () => {
    setEmail('superadmin@speedywheels.com');
    setPassword('superadmin123');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user?.role !== 'super_admin') {
          setError('Access Denied: This portal is reserved exclusively for Platform Super Admins.');
          logout();
          setLoading(false);
          return;
        }
        navigate('/super-admin/dashboard');
      } else {
        setError(res.message || 'Invalid Super Admin credentials. Please check your password.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Invalid Super Admin credentials. Please check your password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-500/20 mb-4 border border-indigo-400/30">
          <span className="text-3xl">🛡️</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Super Admin Console
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Platform-Wide SaaS Management & Control Center
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-start space-x-3">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="text-xs text-rose-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Super Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@speedywheels.com"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Master Security Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating Platform Authority...</span>
                </div>
              ) : (
                'Sign In to Super Admin Console'
              )}
            </button>
          </form>

          {/* Demo fill button */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center space-x-1.5 bg-indigo-950/60 border border-indigo-800/60 px-3 py-1.5 rounded-lg"
            >
              <span>⚡</span>
              <span>Fill Default Demo Super Admin Credentials</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Return to Workshop Customer Portal
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
            Platform Security • <span className="text-indigo-400 font-semibold">Powered by RB Nextwave</span>
          </div>
        </div>
      </div>
    </div>
  );
}

