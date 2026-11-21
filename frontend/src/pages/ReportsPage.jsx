import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  Wrench,
  Clock,
  AlertCircle,
  IndianRupee,
  FileSpreadsheet,
  Phone,
  Search,
  X,
  CheckCircle2,
  Bike
} from 'lucide-react';
import api from '../services/api';

const reportTabs = [
  { id: 'customer-dossier', label: 'Customer-Wise Service Dossier', icon: Phone, endpoint: '/reports/customer-dossier' },
  { id: 'services', label: 'Service & Job Cards Report', icon: Wrench, endpoint: '/reports/services' },
  { id: 'customers', label: 'Customer Lifetime Audit', icon: Users, endpoint: '/reports/customers' },
  { id: 'reminders', label: 'Upcoming & Overdue Reminders', icon: Clock, endpoint: '/reports/reminders' },
  { id: 'pending-payments', label: 'Pending Dues & Balances', icon: AlertCircle, endpoint: '/reports/pending-payments' },
  { id: 'collections', label: 'Payment Collections Report', icon: IndianRupee, endpoint: '/reports/collections' },
];

export default function ReportsPage({ initialPhone }) {
  const [activeTab, setActiveTab] = useState(initialPhone ? 'customer-dossier' : 'customer-dossier');
  const [data, setData] = useState([]);
  const [dossierData, setDossierData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mobileFilter, setMobileFilter] = useState(initialPhone || '9845012345');
  const [dossierError, setDossierError] = useState('');

  const currentTabObj = reportTabs.find((t) => t.id === activeTab) || reportTabs[0];

  const fetchReportData = async () => {
    setLoading(true);
    setDossierError('');

    if (activeTab === 'customer-dossier') {
      const cleanMobile = mobileFilter.replace(/\D/g, '');
      if (!cleanMobile) {
        setDossierData(null);
        setData([]);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/reports/customer-dossier/${encodeURIComponent(cleanMobile)}`);
        if (res.data.success) {
          setDossierData(res.data.data);
          setData(res.data.data.serviceHistory || []);
        }
      } catch (err) {
        console.error('Error loading customer dossier:', err);
        setDossierData(null);
        setData([]);
        setDossierError(err.response?.data?.message || `No records found for customer mobile: ${cleanMobile}`);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        let queryParams = [];
        if (startDate) queryParams.push(`startDate=${startDate}`);
        if (endDate) queryParams.push(`endDate=${endDate}`);
        if (mobileFilter) queryParams.push(`mobile=${encodeURIComponent(mobileFilter.replace(/\D/g, ''))}`);
        const qs = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

        const res = await api.get(`${currentTabObj.endpoint}${qs}`);
        if (res.data.success) {
          setData(res.data.data);
          setDossierData(null);
        }
      } catch (err) {
        console.error('Error loading report:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (initialPhone) {
      setMobileFilter(initialPhone);
      setActiveTab('customer-dossier');
    }
  }, [initialPhone]);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, startDate, endDate]);

  const handleSearchCustomerDossier = (e) => {
    e.preventDefault();
    fetchReportData();
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('token');
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    let downloadUrl = '';
    let filename = '';

    if (activeTab === 'customer-dossier') {
      const cleanMobile = mobileFilter.replace(/\D/g, '');
      if (!cleanMobile) {
        alert('Please enter a mobile number first');
        return;
      }
      downloadUrl = `${apiBase}/reports/customer-dossier/${encodeURIComponent(cleanMobile)}?format=csv`;
      filename = `customer-${cleanMobile}-service-dossier.csv`;
    } else {
      let queryParams = ['format=csv'];
      if (startDate) queryParams.push(`startDate=${startDate}`);
      if (endDate) queryParams.push(`endDate=${endDate}`);
      if (mobileFilter) queryParams.push(`mobile=${encodeURIComponent(mobileFilter.replace(/\D/g, ''))}`);
      downloadUrl = `${apiBase}${currentTabObj.endpoint}?${queryParams.join('&')}`;
      filename = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.csv`;
    }

    fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert('Export failed'));
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Workshop Reports & Analytics</h1>
          <p className="text-slate-500 text-sm">Customer-wise service histories, payment audits and Excel spreadsheet exports</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export to Excel (CSV)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 bg-white p-2 rounded-2xl border border-purple-100 shadow-xs">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-xs ring-1 ring-purple-400/40'
                  : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Common Phone Number & Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-card flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-600">
        {/* Mobile Number Search / Filter */}
        <form onSubmit={handleSearchCustomerDossier} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-purple-900 font-bold">
            <Phone className="w-4 h-4 text-purple-600" />
            <span>Customer Mobile Filter:</span>
          </div>
          <div className="relative w-48">
            <input
              type="text"
              value={mobileFilter}
              onChange={(e) => setMobileFilter(e.target.value)}
              placeholder="e.g. 9845012345"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-purple-200 outline-hidden font-mono"
            />
            {mobileFilter && (
              <button
                type="button"
                onClick={() => setMobileFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-xs text-xs"
          >
            Apply
          </button>
        </form>

        {/* Date Filter (for general reports) */}
        {activeTab !== 'customer-dossier' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-1.5 rounded-lg border border-purple-200 outline-hidden"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-1.5 rounded-lg border border-purple-200 outline-hidden"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-purple-600 hover:text-purple-800 font-semibold text-xs underline"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Customer 360° Summary Header (When on customer-dossier tab) */}
      {activeTab === 'customer-dossier' && dossierData && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-white border border-purple-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-purple-200 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{dossierData.summary.customerName}</h3>
                <span className="text-xs bg-purple-100 text-purple-800 font-bold font-mono px-2 py-0.5 rounded">
                  {dossierData.summary.customerMobile}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{dossierData.customer?.address || 'Address not listed'}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Next Scheduled Service</span>
              <span className="text-sm font-bold text-amber-800 flex items-center sm:justify-end gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {dossierData.summary.nextServiceDate}
              </span>
            </div>
          </div>

          {/* Metric cards conforming to Requirement 3 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-purple-100">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Total Registered Bikes</span>
              <strong className="text-lg font-bold text-purple-900 mt-1 block">
                {dossierData.summary.totalRegisteredBikes} Bikes
              </strong>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                {dossierData.bikes?.map((b) => b.registrationNumber).join(', ')}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-purple-100">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Services Completed</span>
              <strong className="text-lg font-bold text-emerald-700 mt-1 block">
                {dossierData.summary.totalServicesCompleted} Completed
              </strong>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Total Visits: {dossierData.summary.totalServicesRecorded}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-purple-100">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Total Amount Paid</span>
              <strong className="text-lg font-bold text-slate-800 mt-1 block">
                ₹{dossierData.summary.totalPaid.toLocaleString('en-IN')}
              </strong>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Total Billed: ₹{dossierData.summary.totalBilled.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-purple-100">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Pending Payment Amount</span>
              <strong className={`text-lg font-bold mt-1 block ${dossierData.summary.pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ₹{dossierData.summary.pendingBalance.toLocaleString('en-IN')}
              </strong>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Status: {dossierData.summary.pendingBalance === 0 ? 'Fully Cleared' : 'Payment Due'}
              </div>
            </div>
          </div>
        </div>
      )}

      {dossierError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{dossierError}</span>
        </div>
      )}

      {/* Report Table Sheet */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-card overflow-hidden print-container">
        <div className="p-5 border-b border-purple-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">{currentTabObj.label}</h3>
            <p className="text-xs text-slate-400">Total Records Generated: {data.length}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-purple-600">
              <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Generating report data...
            </div>
          ) : data.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fcfaff] font-bold text-purple-950 uppercase border-b border-purple-100">
                <tr>
                  {Object.keys(data[0])
                    .filter((key) => key !== 'id' && key !== '_id')
                    .map((header) => (
                      <th key={header} className="py-3 px-4 capitalize whitespace-nowrap">
                        {header.replace(/([A-Z])/g, ' $1')}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-purple-50/40 transition-colors">
                    {Object.entries(row)
                      .filter(([key]) => key !== 'id' && key !== '_id')
                      .map(([key, value], i) => (
                        <td key={i} className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                          {typeof value === 'number' && (key.includes('Amount') || key.includes('Total') || key.includes('Balance') || key.includes('Billed') || key.includes('Paid'))
                            ? `₹${value.toLocaleString('en-IN')}`
                            : String(value)}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No report entries match the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
