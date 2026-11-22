import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bike, ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2, Building2, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@bikeworkshop.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredEmailNotice, setRegisteredEmailNotice] = useState('');

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
      setPassword('');
      setRegisteredEmailNotice(`Registration successful! Please sign in with ${location.state.registeredEmail}`);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    if (res.success) {
      const origin = location.state?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  const handleQuickTenantLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setLoading(true);
    const res = await login(demoEmail, demoPass);
    if (res.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-purple-200/50">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Bike className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">SpeedyWheels SaaS</h1>
          <p className="text-slate-500 text-xs mt-1">Multi-Tenant Bike Workshop Management Portal</p>
        </div>

        {/* Tab switch between Sign In and Register */}
        <div className="flex bg-purple-50 p-1 rounded-2xl border border-purple-200/70 mb-5">
          <button
            type="button"
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all bg-purple-600 text-white shadow-xs"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-purple-900 hover:text-purple-700"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Workshop</span>
          </button>
        </div>

        {/* Post-Registration Success Notice */}
        {registeredEmailNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{registeredEmailNotice}</span>
          </div>
        )}

        {/* Multi-Tenant Demo Access Cards */}
        <div className="mb-5 p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              SaaS Multi-Tenant Demo Accounts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {/* Workshop 1 */}
            <button
              type="button"
              onClick={() => handleQuickTenantLogin('admin@bikeworkshop.com', 'admin123')}
              disabled={loading}
              className="p-2.5 bg-white hover:bg-purple-100/60 border border-purple-200 text-left rounded-xl transition-all shadow-2xs hover:border-purple-400 group"
            >
              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-tight flex items-center gap-1">
                <Building2 className="w-3 h-3 text-purple-600" />
                WS-1001
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">SpeedyWheels</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">admin@bikeworkshop.com</div>
            </button>

            {/* Workshop 2 */}
            <button
              type="button"
              onClick={() => handleQuickTenantLogin('owner@apexmotohub.com', 'apex123')}
              disabled={loading}
              className="p-2.5 bg-white hover:bg-purple-100/60 border border-purple-200 text-left rounded-xl transition-all shadow-2xs hover:border-purple-400 group"
            >
              <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-tight flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-600" />
                WS-1002
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">Apex Moto Hub</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">owner@apexmotohub.com</div>
            </button>
          </div>
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

        <div className="mt-6 pt-4 border-t border-purple-50 text-center">
          <p className="text-xs text-slate-500">
            Need a separate account for your garage?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-purple-700 font-bold hover:underline"
            >
              Register your workshop
            </button>
          </p>
        </div>

        <div className="mt-4 text-center text-slate-400 text-[11px] space-y-1">
          <div>Multi-Tenant SaaS Architecture • Isolated Tenant Databases</div>
          <div className="text-purple-600 font-semibold text-xs pt-1">
            Powered by RB Nextwave
          </div>
        </div>
      </div>
    </div>
  );
}
