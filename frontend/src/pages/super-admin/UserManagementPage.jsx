import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function UserManagementPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/sessions');
      if (res.data?.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load user sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (session) => {
    if (!window.confirm(`Revoke active session for ${session.user_name} (${session.email})?`)) {
      return;
    }

    try {
      setRevokingId(session._id);
      const res = await api.delete(`/super-admin/sessions/${session._id}`);
      if (res.data?.success) {
        setSessions((prev) =>
          prev.map((s) => (s._id === session._id ? { ...s, status: 'revoked' } : s))
        );
      }
    } catch (err) {
      console.error('Failed to revoke session:', err);
      alert('Could not revoke session.');
    } finally {
      setRevokingId(null);
    }
  };

  const activeSessionsCount = sessions.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Active Users & Sessions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time live session telemetry, connected devices, and remote access revocation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 px-3 py-1.5 rounded-xl font-medium flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping"></span>
            {activeSessionsCount} Live Users Online
          </span>
          <button
            onClick={fetchSessions}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition"
            title="Refresh Sessions"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Session Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Polling active session telemetry...
          </div>
        ) : sessions.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            No active user sessions recorded.
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = sess.status === 'active';
            return (
              <div
                key={sess._id}
                className={`p-5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-slate-900 border-slate-800 shadow-xl'
                    : 'bg-slate-950/60 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                      {sess.role === 'super_admin' ? '🛡️' : '👤'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{sess.user_name}</h3>
                      <p className="text-xs text-slate-400">{sess.email}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {sess.status}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Workshop:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[180px]">
                      {sess.workshop_name || 'Platform HQ'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Device / Browser:</span>
                    <span className="text-slate-300 truncate max-w-[180px]">
                      {sess.device_info || 'Unknown Client'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IP Address:</span>
                    <span className="font-mono text-indigo-400">{sess.ip_address || '127.0.0.1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Logged In:</span>
                    <span className="text-slate-400">
                      {new Date(sess.login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Active:</span>
                    <span className="text-slate-400">
                      {new Date(sess.last_activity_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {isActive && (
                  <div className="mt-5 pt-3 border-t border-slate-800/60 flex justify-end">
                    <button
                      onClick={() => handleRevokeSession(sess)}
                      disabled={revokingId === sess._id}
                      className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold transition"
                    >
                      {revokingId === sess._id ? 'Revoking...' : 'Terminate Session'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

