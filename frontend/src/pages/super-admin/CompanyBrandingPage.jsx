import React, { useState, useEffect } from 'react';
import api, { getSocketUrl } from '../../services/api';

export default function CompanyBrandingPage() {
  const [branding, setBranding] = useState({
    company_name: '',
    company_logo: '',
    favicon: '',
    support_email: '',
    support_phone: '',
    address: '',
    website_url: '',
    default_currency: 'INR',
    default_timezone: 'Asia/Kolkata',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const socketUrl = getSocketUrl();

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/branding');
      if (res.data?.success && res.data?.data) {
        setBranding(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');

      const formData = new FormData();
      formData.append('company_name', branding.company_name);
      formData.append('support_email', branding.support_email);
      formData.append('support_phone', branding.support_phone);
      formData.append('address', branding.address);
      formData.append('website_url', branding.website_url);
      formData.append('default_currency', branding.default_currency);
      formData.append('default_timezone', branding.default_timezone);

      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (logoPreview) {
        formData.append('company_logo_base64', logoPreview);
      }

      const res = await api.put('/super-admin/branding', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setBranding(res.data.data);
        setMessage('Platform branding and identity settings updated successfully!');
        setLogoFile(null);
      }
    } catch (err) {
      console.error('Failed to update branding:', err);
      alert('Error updating platform branding.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading platform identity...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Company Logo & Platform Branding
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize platform-wide corporate branding, customer support channels, and default locale standards.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-sm flex items-center space-x-2">
          <span>✅</span>
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Logo Section */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Platform Brand Logo
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview || branding.company_logo ? (
                <img
                  src={
                    logoPreview ||
                    (branding.company_logo.startsWith('http')
                      ? branding.company_logo
                      : `${socketUrl}${branding.company_logo}`)
                  }
                  alt="Company Logo"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <span className="text-3xl">🏍️</span>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition">
                <span>Upload New Logo</span>
                <input
                  type="file"
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-500">
                Supports PNG, JPG, WebP, SVG. Recommended dimensions: 256x256 px.
              </p>
            </div>
          </div>
        </div>

        {/* Company Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Platform / Company Name
            </label>
            <input
              type="text"
              required
              value={branding.company_name}
              onChange={(e) => setBranding({ ...branding, company_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={branding.website_url}
              onChange={(e) => setBranding({ ...branding, website_url: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Support Desk Email
            </label>
            <input
              type="email"
              required
              value={branding.support_email}
              onChange={(e) => setBranding({ ...branding, support_email: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Toll-Free / Support Phone
            </label>
            <input
              type="text"
              required
              value={branding.support_phone}
              onChange={(e) => setBranding({ ...branding, support_phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Corporate Headquarters Address
            </label>
            <input
              type="text"
              value={branding.address}
              onChange={(e) => setBranding({ ...branding, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Platform Currency
            </label>
            <select
              value={branding.default_currency}
              onChange={(e) => setBranding({ ...branding, default_currency: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Default Platform Timezone
            </label>
            <select
              value={branding.default_timezone}
              onChange={(e) => setBranding({ ...branding, default_timezone: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="UTC">UTC (Universal Coordinated Time)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition"
          >
            {saving ? 'Saving Platform Changes...' : 'Save Branding Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

