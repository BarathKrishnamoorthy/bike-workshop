import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function PlatformReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/reports');
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData?.workshopBreakdown) return;
    const headers = 'Workshop Name,Workshop ID,Location,Status,Customers,Job Cards,Revenue (INR)\n';
    const rows = reportData.workshopBreakdown
      .map(
        (w) =>
          `"${w.workshop_name}","${w.workshop_id}","${w.location}","${w.status}",${w.customers},${w.job_cards},${w.total_revenue}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speedywheels-platform-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Aggregating cross-tenant analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform-Wide Aggregated Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Macro-level operational trends, volume throughput, and gross billing aggregates.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition"
        >
          <span>📥</span>
          <span>Export Platform Summary (CSV)</span>
        </button>
      </div>

      {/* Aggregated Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <span className="text-xs uppercase text-slate-400 font-bold">Total Platform Revenue</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">
            ₹{(reportData?.totalPlatformRevenue || 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <span className="text-xs uppercase text-slate-400 font-bold">Registered Workshops</span>
          <p className="text-2xl font-extrabold text-white mt-2">
            {reportData?.totalWorkshops || 0}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <span className="text-xs uppercase text-slate-400 font-bold">Total Service Job Cards</span>
          <p className="text-2xl font-extrabold text-white mt-2">
            {reportData?.totalJobCards || 0}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <span className="text-xs uppercase text-slate-400 font-bold">Unique Customers Served</span>
          <p className="text-2xl font-extrabold text-white mt-2">
            {reportData?.totalCustomers || 0}
          </p>
        </div>
      </div>

      {/* Monthly Activity Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Job Cards Chart Bars */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <span>🔧</span>
            <span>Monthly Job Card Volume Throughput</span>
          </h2>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-slate-800">
            {reportData?.serviceTrend?.map((item, idx) => {
              const maxVal = Math.max(...reportData.serviceTrend.map((t) => t.count), 1);
              const heightPercent = Math.min(100, Math.max(15, (item.count / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-indigo-400 mb-1">{item.count}</span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-lg transition-all duration-300"
                  ></div>
                  <span className="text-[10px] text-slate-400 mt-2 font-semibold">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Gross Invoiced Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <span>💳</span>
            <span>Platform Monthly Invoiced Billing (₹)</span>
          </h2>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-slate-800">
            {reportData?.revenueTrend?.map((item, idx) => {
              const maxVal = Math.max(...reportData.revenueTrend.map((t) => t.revenue), 1);
              const heightPercent = Math.min(100, Math.max(15, (item.revenue / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <span className="text-[9px] font-bold text-emerald-400 mb-1">
                    {(item.revenue / 1000).toFixed(0)}k
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-lg transition-all duration-300"
                  ></div>
                  <span className="text-[10px] text-slate-400 mt-2 font-semibold">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Workshop Matrix Comparison */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/70 border-b border-slate-800">
          <h3 className="font-bold text-sm text-white">Workshop Performance Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Workshop</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Customers</th>
                <th className="py-3 px-4 text-center">Job Cards</th>
                <th className="py-3 px-4 text-right">Revenue Recorded</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reportData?.workshopBreakdown?.map((ws) => (
                <tr key={ws.workshop_id} className="hover:bg-slate-850/50">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {ws.workshop_name}
                    <span className="block text-[10px] text-slate-500 font-mono">{ws.workshop_id}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{ws.location}</td>
                  <td className="py-3.5 px-4 text-center font-bold">{ws.customers}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-indigo-400">{ws.job_cards}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                    ₹{ws.total_revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        ws.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-rose-950 text-rose-400'
                      }`}
                    >
                      {ws.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

