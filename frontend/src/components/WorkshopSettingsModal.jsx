import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  User,
  MapPin,
  Phone,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function WorkshopSettingsModal({ isOpen, onClose }) {
  const { user, workshop, updateWorkshop, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('workshop'); // 'workshop' | 'profile'

  // Workshop form state
  const [workshopName, setWorkshopName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');

  // Profile form state
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (workshop) {
      setWorkshopName(workshop.workshop_name || user?.workshopName || '');
      setLocation(workshop.location || user?.address || '');
      setPhone(workshop.phone_number || user?.phone_number || user?.phone || '');
    }
    if (user) {
      setUserName(user.name || '');
      setUserPhone(user.phone_number || user.phone || '');
    }
  }, [workshop, user, isOpen]);

  if (!isOpen) return null;

  const handleSaveWorkshop = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const res = await updateWorkshop({
      workshop_name: workshopName,
      location,
      phone_number: phone,
    });

    setSaving(false);
    if (res.success) {
      setMessage('Workshop settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setError(res.message);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const res = await updateProfile({
      name: userName,
      phone_number: userPhone,
    });

    setSaving(false);
    if (res.success) {
      setMessage('Personal profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex min-h-full items-start sm:items-center justify-center p-2 sm:p-5 pt-3 sm:pt-5">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Workshop & Tenant Settings</h2>
              <div className="flex items-center gap-2 text-xs text-purple-200/80">
                <span>Tenant ID: <strong className="text-white font-mono">{workshop?.workshop_id || user?.workshop_id || 'WS-1001'}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Isolated SaaS Tenant
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-purple-100 bg-purple-50/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('workshop')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'workshop'
                ? 'border-purple-600 text-purple-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Workshop Profile
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-purple-600 text-purple-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            Personal Profile
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {message && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tenant Metadata Info Box */}
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200/80">
            <div className="text-[11px] font-bold text-purple-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-600" />
              SaaS Multi-Tenant Architecture State
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-white rounded-xl border border-purple-100">
                <span className="text-[10px] text-slate-400 block uppercase">Tenant ID</span>
                <span className="font-mono font-bold text-purple-800">{workshop?.workshop_id || user?.workshop_id}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-purple-100">
                <span className="text-[10px] text-slate-400 block uppercase">Owner User ID</span>
                <span className="font-mono font-bold text-slate-700">{workshop?.owner_user_id || user?.user_id || user?.id}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-purple-100">
                <span className="text-[10px] text-slate-400 block uppercase">Tenant Status</span>
                <span className="font-bold text-emerald-600 capitalize">{workshop?.status || 'Active'}</span>
              </div>
            </div>
          </div>

          {activeTab === 'workshop' ? (
            <form onSubmit={handleSaveWorkshop} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Workshop Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Workshop Address / Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Workshop Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Email is locked as your unique account identifier.</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Update Profile'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

