import React, { useState, useEffect } from 'react';
import {
  Users,
  Bike,
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Phone,
  PlusCircle,
  Search,
  ExternalLink,
  ChevronRight,
  X,
  CreditCard,
  Wrench,
  FileText
} from 'lucide-react';
import api from '../services/api';

export default function DashboardPage({ onNavigate, onOpenNewJobCard, onLookupCustomer }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard Phone Lookup state
  const [dashPhone, setDashPhone] = useState('');
  const [customerSummary, setCustomerSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLookupCustomerOnDashboard = async (e) => {
    if (e) e.preventDefault();
    const clean = dashPhone.replace(/\D/g, '');
    if (!clean) {
      setSummaryError('Please enter a mobile number to search.');
      return;
    }

    try {
      setSummaryLoading(true);
      setSummaryError('');
      const res = await api.get(`/dashboard/customer-summary/${encodeURIComponent(clean)}`);
      if (res.data.success) {
        setCustomerSummary(res.data.data);
      }
    } catch (err) {
      console.error('Error looking up customer:', err);
      setCustomerSummary(null);
      setSummaryError(err.response?.data?.message || 'No customer found matching this mobile number.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleClearSummary = () => {
    setDashPhone('');
    setCustomerSummary(null);
    setSummaryError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-purple-800 font-semibold">Loading workshop insights...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalCustomers: 0,
    totalBikes: 0,
    todayBookings: 0,
    completedServices: 0,
    pendingServices: 0,
    todayCollection: 0,
    monthlyRevenue: 0,
    outstandingPayments: 0,
  };

  const statusColors = {
    'Booked': 'bg-blue-50 text-blue-700 border-blue-200',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
    'Ready': 'bg-purple-50 text-purple-700 border-purple-200',
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-purple-100 mb-2">
            Workshop Operations
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Today's Workshop Overview</h1>
          <p className="text-purple-200 text-xs sm:text-sm mt-1 max-w-xl">
            Monitor real-time service bookings, job card progression, parts billing, and customer delivery schedules.
          </p>
        </div>
        <button
          onClick={onOpenNewJobCard}
          className="w-full sm:w-auto bg-white text-purple-900 hover:bg-purple-50 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow transition-all flex items-center justify-center space-x-2 active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-purple-700" />
          <span>Create New Job Card</span>
        </button>
      </div>

      {/* Module 1 Requirement: Customer Phone Search & Overview Widget on Dashboard */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-card space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-purple-600" />
              <span>Customer Identification & History Lookup</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Enter customer mobile number to view their complete service history & payment overview
            </p>
          </div>
          <form onSubmit={handleLookupCustomerOnDashboard} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Phone className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="tel"
                value={dashPhone}
                onChange={(e) => setDashPhone(e.target.value)}
                placeholder="e.g. 9845012345"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={summaryLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors shrink-0 active:scale-95"
            >
              {summaryLoading ? 'Searching...' : 'Search'}
            </button>
            {customerSummary && (
              <button
                type="button"
                onClick={handleClearSummary}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {summaryError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{summaryError}</span>
          </div>
        )}

        {/* Customer Service & Payment Overview Card */}
        {customerSummary && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-white border border-purple-200/90 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-purple-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-bold text-slate-800">{customerSummary.customer.name}</h4>
                  <span className="text-xs bg-purple-100 text-purple-800 font-mono font-bold px-2.5 py-0.5 rounded-full">
                    {customerSummary.customer.mobile}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{customerSummary.customer.address || 'Address not listed'}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onLookupCustomer && onLookupCustomer(customerSummary.customer.mobile)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>360° Dossier</span>
                </button>
                <button
                  onClick={() => onNavigate('services')}
                  className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold transition-colors"
                >
                  Services
                </button>
              </div>
            </div>

            {/* Service & Payment Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-purple-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Registered Bikes</span>
                <span className="text-base sm:text-lg font-bold text-purple-900 mt-1 block">
                  {customerSummary.bikes.length} Vehicles
                </span>
                <div className="text-[11px] text-slate-600 font-mono mt-0.5 truncate">
                  {customerSummary.bikes.map((b) => b.registrationNumber).join(', ')}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Service History</span>
                <span className="text-base sm:text-lg font-bold text-emerald-700 mt-1 block">
                  {customerSummary.serviceSummary.completedServices} Completed
                </span>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {customerSummary.serviceSummary.activeServices} Active
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Total Billed & Paid</span>
                <span className="text-base sm:text-lg font-bold text-slate-800 mt-1 block">
                  ₹{customerSummary.paymentOverview.totalPaid.toLocaleString('en-IN')}
                </span>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Gross: ₹{customerSummary.paymentOverview.totalBilled.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Outstanding Balance</span>
                <span className={`text-base sm:text-lg font-bold mt-1 block ${customerSummary.paymentOverview.pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {customerSummary.paymentOverview.pendingBalance > 0 ? `₹${customerSummary.paymentOverview.pendingBalance.toLocaleString('en-IN')}` : 'Nil'}
                </span>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Next Due: {customerSummary.customer.nextServiceDate || 'Not scheduled'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Customers & Bikes */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-purple-100 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Customers & Bikes</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{metrics.totalCustomers}</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
              <Bike className="w-3.5 h-3.5 text-purple-500" />
              <span>{metrics.totalBikes} Registered Bikes</span>
            </p>
          </div>
        </div>

        {/* Today's Service Bookings */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-purple-100 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Today's Bookings</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{metrics.todayBookings}</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
              {metrics.pendingServices} In Progress / Pending
            </p>
          </div>
        </div>

        {/* Today's Collection */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-purple-100 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Today's Collection</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">₹{metrics.todayCollection.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Month: ₹{metrics.monthlyRevenue.toLocaleString('en-IN')}</span>
            </p>
          </div>
        </div>

        {/* Outstanding Payments */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-purple-100 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Outstanding Dues</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <h3 className="text-xl sm:text-2xl font-bold text-rose-600 truncate">₹{metrics.outstandingPayments.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
              Pending service balances
            </p>
          </div>
        </div>
      </div>

      {/* Main Sections: Recent Services & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Recent Job Cards (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-purple-100 shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-purple-50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm sm:text-base">Active & Recent Job Cards</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">Live service tracking and billing summary</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('services')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Card View (For Phones < md) */}
          <div className="md:hidden divide-y divide-purple-50">
            {data?.recentServices?.length > 0 ? (
              data.recentServices.map((srv) => (
                <div key={srv._id} className="p-3.5 space-y-2 hover:bg-purple-50/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-700 font-mono text-xs">
                      {srv.jobCardNumber}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[srv.status] || 'bg-slate-100 text-slate-700'}`}>
                      {srv.status}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{srv.customer?.name || 'Walk-in'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {srv.bike ? `${srv.bike.brand} ${srv.bike.model} (${srv.bike.registrationNumber})` : 'Bike N/A'}
                      </div>
                      {srv.customer?.mobile && (
                        <button
                          onClick={() => onLookupCustomer && onLookupCustomer(srv.customer.mobile)}
                          className="text-[11px] text-purple-700 font-mono flex items-center gap-1 mt-0.5 underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{srv.customer.mobile}</span>
                        </button>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-800 text-xs">₹{srv.totalAmount?.toLocaleString('en-IN')}</div>
                      {srv.pendingBalance > 0 ? (
                        <div className="text-[11px] text-rose-600 font-bold">Due: ₹{srv.pendingBalance.toLocaleString('en-IN')}</div>
                      ) : (
                        <div className="text-[10px] text-emerald-600 font-semibold">Fully Paid</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No service bookings recorded yet.
              </div>
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fcfaff] text-xs font-semibold text-purple-950 uppercase border-b border-purple-100">
                <tr>
                  <th className="py-3 px-4">Job Card</th>
                  <th className="py-3 px-4">Customer & Bike</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Bill / Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {data?.recentServices?.length > 0 ? (
                  data.recentServices.map((srv) => (
                    <tr key={srv._id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-purple-700">
                        {srv.jobCardNumber}
                        <div className="text-[11px] font-normal text-slate-400">
                          {new Date(srv.serviceDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{srv.customer?.name || 'Walk-in Customer'}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {srv.bike ? `${srv.bike.brand} ${srv.bike.model} (${srv.bike.registrationNumber})` : 'Bike not specified'}
                        </div>
                        {srv.customer?.mobile && (
                          <button
                            onClick={() => onLookupCustomer && onLookupCustomer(srv.customer.mobile)}
                            className="text-[11px] text-purple-700 font-mono underline hover:text-purple-950"
                          >
                            {srv.customer.mobile}
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                          {srv.serviceType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[srv.status] || 'bg-slate-100 text-slate-700'}`}>
                          {srv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-800">₹{srv.totalAmount?.toLocaleString('en-IN')}</div>
                        {srv.pendingBalance > 0 ? (
                          <div className="text-xs text-rose-600 font-semibold">Due: ₹{srv.pendingBalance.toLocaleString('en-IN')}</div>
                        ) : (
                          <div className="text-[11px] text-emerald-600 font-medium">Fully Paid</div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                      No service bookings recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Upcoming Service Reminders */}
        <div className="bg-white rounded-2xl border border-purple-100 shadow-card overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-purple-50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm sm:text-base">Service Reminders</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">Upcoming periodic maintenance</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900"
            >
              Export
            </button>
          </div>

          <div className="p-3 sm:p-4 space-y-3 flex-1 overflow-y-auto max-h-[460px]">
            {data?.upcomingReminders?.length > 0 ? (
              data.upcomingReminders.map((rem) => {
                const dueDate = new Date(rem.nextServiceDate);
                const isOverdue = dueDate < new Date();
                return (
                  <div
                    key={rem._id}
                    className="p-3 sm:p-3.5 rounded-xl border border-purple-100/80 hover:border-purple-300 bg-purple-50/20 hover:bg-purple-50/50 transition-all flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                          {rem.customer?.name || 'Customer'}
                        </span>
                        {isOverdue ? (
                          <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                            Overdue
                          </span>
                        ) : (
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                            Due Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-purple-900/80 font-medium mt-0.5 font-mono">
                        {rem.bike?.brand} {rem.bike?.model} • {rem.bike?.registrationNumber}
                      </p>
                      <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-2">
                        <span>Target: {dueDate.toLocaleDateString()}</span>
                        {rem.nextServiceKilometre > 0 && (
                          <span>| {rem.nextServiceKilometre} KM</span>
                        )}
                      </div>
                    </div>
                    {rem.customer?.mobile && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => onLookupCustomer && onLookupCustomer(rem.customer.mobile)}
                          className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors shadow-xs"
                          title="View 360° Profile"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`tel:${rem.customer.mobile}`}
                          className="p-2 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-600 hover:text-white transition-colors shadow-xs"
                          title={`Call ${rem.customer.mobile}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                No upcoming service reminders in the next 30 days.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
