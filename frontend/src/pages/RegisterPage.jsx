import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bike,
  Building2,
  MapPin,
  Phone,
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage({ onSwitchToLogin, onRegistrationSuccess }) {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    workshop_name: '',
    location: '',
    phone_number: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleProceedToLogin = (regEmail) => {
    if (onSwitchToLogin) {
      onSwitchToLogin(regEmail);
    } else {
      navigate('/login', { state: { registeredEmail: regEmail } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!formData.name.trim()) return setError('Please enter your full name');
    if (!formData.email.trim()) return setError('Please enter a valid email address');
    if (!formData.password || formData.password.length < 6) return setError('Password must be at least 6 characters long');
    if (!formData.workshop_name.trim()) return setError('Please enter your workshop name');
    if (!formData.location.trim()) return setError('Please enter workshop location / address');
    if (!formData.phone_number.trim()) return setError('Please enter workshop phone number');

    setLoading(true);
    const res = await register(formData);
    setLoading(false);

    if (res.success) {
      setSuccessInfo({
        message: res.message,
        userId: res.user?.user_id,
        workshopId: res.workshop?.workshop_id,
        email: formData.email,
      });

      if (onRegistrationSuccess) {
        onRegistrationSuccess(formData.email);
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center p-4 py-8">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-200/50">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Bike className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Create Workshop Account</h1>
          <p className="text-slate-500 text-xs mt-1">
            Register your bike garage or repair center on the SaaS Portal
          </p>
        </div>

        {/* Success Alert */}
        {successInfo ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 mb-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <h3 className="font-bold text-sm text-emerald-800">Registration Completed Successfully!</h3>
            </div>
            <p className="text-xs text-emerald-700">
              Your multi-tenant workshop account has been established with full data isolation.
            </p>
            <div className="p-3 bg-white/80 rounded-xl font-mono text-xs space-y-1 text-slate-800 border border-emerald-100">
              <div>Assigned Workshop ID: <strong className="text-purple-700">{successInfo.workshopId}</strong></div>
              <div>Assigned User ID: <strong className="text-purple-700">{successInfo.userId}</strong></div>
              <div>Owner Email: <strong>{successInfo.email}</strong></div>
            </div>
            <button
              onClick={() => handleProceedToLogin(successInfo.email)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Login Page</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section: Owner Information */}
            <div className="pt-1">
              <div className="text-[11px] font-bold text-purple-900/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span>Workshop Owner Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Suresh Kumar"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="owner@myworkshop.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Password <span className="text-rose-500">*</span> (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
                />
              </div>
            </div>

            {/* Section: Workshop Details */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-purple-900/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Workshop Information</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Workshop / Business Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="workshop_name"
                      required
                      value={formData.workshop_name}
                      onChange={handleChange}
                      placeholder="e.g. Royal Riders Auto Garage"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="phone_number"
                        required
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="+91 98765 00000"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Location / City <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="location"
                        required
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. Indiranagar, Bangalore"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition-all active:scale-98 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Workshop Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer switch to Login */}
        <div className="mt-6 pt-4 border-t border-purple-50 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Already registered your workshop?{' '}
            <button
              type="button"
              onClick={() => handleProceedToLogin()}
              className="text-purple-700 font-bold hover:underline inline-flex items-center gap-1"
            >
              Sign In to Portal
            </button>
          </p>
          <p className="text-[11px] text-purple-700 font-semibold pt-1">
            Powered by RB Nextwave
          </p>
        </div>
      </div>
    </div>
  );
}
