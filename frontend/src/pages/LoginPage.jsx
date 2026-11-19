import React, { useState } from 'react';
import { Bike, ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@bikeworkshop.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.message);
    }
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setEmail('admin@bikeworkshop.com');
    setPassword('admin123');
    setError('');
    setLoading(true);
    const res = await login('admin@bikeworkshop.com', 'admin123');
    if (!res.success) {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-purple-200/50">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Bike className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">SpeedyWheels Portal</h1>
          <p className="text-slate-500 text-xs mt-1">Bike Workshop Management System</p>
        </div>

        {/* Demo Login Quick Access Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-purple-50 border border-purple-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Demo Access Credentials
            </span>
          </div>
          <div className="text-xs text-purple-900/80 font-mono space-y-0.5">
            <div>User: <strong>admin@bikeworkshop.com</strong></div>
            <div>Pass: <strong>admin123</strong></div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full mt-3 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>One-Click Demo Admin Login</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@workshop.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition-all active:scale-98 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In to Workshop Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-purple-50 text-center text-slate-400 text-[11px]">
          SpeedyWheels Management System • Secure JWT Authentication
        </div>
      </div>
    </div>
  );
}
