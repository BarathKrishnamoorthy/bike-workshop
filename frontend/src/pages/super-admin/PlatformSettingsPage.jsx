import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    allow_workshop_registration: true,
    email_notifications_enabled: true,
    sms_notifications_enabled: false,
    auto_backup_enabled: true,
    backup_frequency: 'daily',
    max_upload_size_mb: 10,
    support_chat_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/settings');
      if (res.data?.success && res.data?.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);
      const res = await api.put('/super-admin/settings', settings);
      if (res.data?.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Could not update platform settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System Configuration & Platform Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Global controls for onboarding, maintenance windows, backups, and security policies.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-sm flex items-center space-x-2">
          <span>✅</span>
          <span>Platform settings updated and deployed across all microservices!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Registration & Access Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>🚪</span>
            <span>Registration & Access Policies</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800/80">
              <div>
                <p className="font-semibold text-sm text-white">Public Workshop Self-Registration</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Allow new bike workshops to sign up directly via the public /register page.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.allow_workshop_registration}
                onChange={(e) =>
                  setSettings({ ...settings, allow_workshop_registration: e.target.checked })
                }
                className="w-5 h-5 text-indigo-600 rounded bg-slate-900 border-slate-700"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800/80">
              <div>
                <p className="font-semibold text-sm text-white">System Maintenance Mode</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Temporarily lock workshop access during planned platform migrations or updates.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) =>
                  setSettings({ ...settings, maintenance_mode: e.target.checked })
                }
                className="w-5 h-5 text-indigo-600 rounded bg-slate-900 border-slate-700"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800/80">
              <div>
                <p className="font-semibold text-sm text-white">Live Customer Support Chat</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Display floating live support widget on workshops' dashboards.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.support_chat_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, support_chat_enabled: e.target.checked })
                }
                className="w-5 h-5 text-indigo-600 rounded bg-slate-900 border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Backups & Storage Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>💾</span>
            <span>Backups & File Storage</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Automated Database Backup
              </label>
              <div className="flex items-center space-x-3 mt-2">
                <input
                  type="checkbox"
                  checked={settings.auto_backup_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, auto_backup_enabled: e.target.checked })
                  }
                  className="w-5 h-5 text-indigo-600 rounded bg-slate-900 border-slate-700"
                />
                <span className="text-sm text-slate-300">Enabled</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Backup Frequency
              </label>
              <select
                value={settings.backup_frequency}
                onChange={(e) => setSettings({ ...settings, backup_frequency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
              >
                <option value="hourly">Hourly Snapshots</option>
                <option value="daily">Daily Midnight Snapshot</option>
                <option value="weekly">Weekly Archive</option>
              </select>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Max Attachment Upload Limit (MB)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.max_upload_size_mb}
                onChange={(e) =>
                  setSettings({ ...settings, max_upload_size_mb: Number(e.target.value) })
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition"
          >
            {saving ? 'Updating Settings...' : 'Save System Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

