import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('All');
  const [searchAction, setSearchAction] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (moduleFilter !== 'All') params.module = moduleFilter;
      if (searchAction) params.action = searchAction;

      const res = await api.get('/super-admin/logs', { params });
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const modules = [
    'All',
    'Authentication',
    'Workshop Management',
    'User Management',
    'Service Management',
    'Payment & Billing',
    'Branding & Settings',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Activity Audit & Security Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tamper-evident system activity trail of administrative operations, log-ins, and data mutations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 self-start sm:self-auto transition"
          title="Refresh Logs"
        >
          🔄 Refresh Logs
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="w-full md:w-80 flex items-center space-x-2">
          <input
            type="text"
            value={searchAction}
            onChange={(e) => setSearchAction(e.target.value)}
            placeholder="Search by action keyword (e.g. LOGIN)..."
            className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setModuleFilter(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                moduleFilter === m
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Tenant / IP</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No activity logs recorded under this filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-850/50">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/50">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">{log.module}</td>
                    <td className="py-3.5 px-4 text-slate-200 max-w-sm truncate">{log.description}</td>
                    <td className="py-3.5 px-4 font-medium text-white">{log.user_name}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300">{log.workshop_id || 'System Platform'}</div>
                      <div className="text-slate-500 font-mono text-[10px]">{log.ip_address}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

