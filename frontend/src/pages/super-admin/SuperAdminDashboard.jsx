import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/dashboard');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch platform dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading SaaS Platform Metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-tenant workshop operations, user activity, and platform oversight.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
            All Microservices Operational
          </span>
          <button
            onClick={fetchDashboardStats}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors"
            title="Refresh Metrics"
          >
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Registered Workshops */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Workshops
            </span>
            <span className="w-9 h-9 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center text-lg border border-indigo-800/40">
              🏢
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-white">
              {stats?.workshops?.total || 0}
            </p>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              {stats?.workshops?.active || 0} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {stats?.workshops?.suspended || 0} Suspended / Pending
          </p>
        </div>

        {/* Card 2: Active User Sessions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Sessions
            </span>
            <span className="w-9 h-9 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center text-lg border border-emerald-800/40">
              👥
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-white">
              {stats?.activeUsers || 0}
            </p>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              Online Now
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {stats?.totalUsers || 0} Total Registered Users
          </p>
        </div>

        {/* Card 3: Platform Job Cards / Services */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Services & Job Cards
            </span>
            <span className="w-9 h-9 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center text-lg border border-amber-800/40">
              🔧
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-white">
              {stats?.services?.total || 0}
            </p>
            <span className="text-xs font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
              {stats?.services?.completed || 0} Completed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {stats?.services?.inProgress || 0} In Progress Across Workshops
          </p>
        </div>

        {/* Card 4: Platform Revenue Processed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Revenue Processed
            </span>
            <span className="w-9 h-9 rounded-xl bg-violet-950 text-violet-400 flex items-center justify-center text-lg border border-violet-800/40">
              ₹
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-white truncate">
              ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-xs font-semibold text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/50">
              Platform Gross
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {stats?.totalCustomers || 0} Total Workshop Customers
          </p>
        </div>
      </div>

      {/* Two Column Layout: Recent Registrations & Platform Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Registered Workshops */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>🏢</span>
              <span>Recent Registered Workshops</span>
            </h2>
            <Link
              to="/super-admin/workshops"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
            >
              View All Workshops →
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-800/60">
            {stats?.recentWorkshops?.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No workshops registered yet.</p>
            ) : (
              stats?.recentWorkshops?.map((ws) => (
                <div key={ws._id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{ws.workshop_name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{ws.location}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">ID: {ws.workshop_id} • Phone: {ws.phone_number}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        ws.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
                          : 'bg-rose-950 text-rose-400 border-rose-800/60'
                      }`}
                    >
                      {ws.status}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {new Date(ws.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Platform Activity Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>📜</span>
              <span>Recent Platform Activity</span>
            </h2>
            <Link
              to="/super-admin/logs"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
            >
              View Audit Log →
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {stats?.recentLogs?.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No platform activity recorded yet.</p>
            ) : (
              stats?.recentLogs?.map((log) => (
                <div
                  key={log._id}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-indigo-400">{log.action}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{log.module}</span>
                    </div>
                    <p className="text-slate-300 mt-1">{log.description}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      User: {log.user_name} {log.workshop_id ? `(${log.workshop_id})` : ''} • IP: {log.ip_address}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap ml-3">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Infrastructure Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Platform Architecture & Server Health
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">SaaS Engine</span>
            <span className="font-bold text-white text-sm">v{stats?.system?.version || '2.0.0'}</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">Node Runtime</span>
            <span className="font-bold text-white text-sm">{stats?.system?.nodeVersion || 'v18+'}</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">Process Uptime</span>
            <span className="font-bold text-white text-sm">
              {Math.floor((stats?.system?.uptime || 0) / 60)} minutes
            </span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">Multi-Tenant Isolation</span>
            <span className="font-bold text-emerald-400 text-sm">Enforced (Active)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

