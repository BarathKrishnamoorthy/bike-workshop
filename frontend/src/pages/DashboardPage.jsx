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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-purple-800 font-medium">Loading workshop insights...</p>
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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 rounded-2xl p-6 text-white shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-semibold uppercase tracking-wider text-purple-100 mb-2">
            Workshop Operations
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Today's Workshop Overview</h1>
          <p className="text-purple-200 text-sm mt-1 max-w-xl">
            Monitor real-time service bookings, job card progression, parts billing, and customer delivery schedules.
          </p>
        </div>
        <button
          onClick={onOpenNewJobCard}
          className="bg-white text-purple-900 hover:bg-purple-50 font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center space-x-2 active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-purple-700" />
          <span>Create New Job Card</span>
        </button>
      </div>

      {/* Module 1 Requirement: Customer Phone Search & Overview Widget on Dashboard */}
      <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-purple-600" />
              <span>Customer Identification & History Lookup</span>
            </h3>
            <p className="text-xs text-slate-500">
              Enter customer mobile number to view their complete service history & payment overview
            </p>
          </div>
          <form onSubmit={handleLookupCustomerOnDashboard} className="flex items-center gap-2 max-w-md w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Phone className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dashPhone}
                onChange={(e) => setDashPhone(e.target.value)}
                placeholder="e.g. 9845012345"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={summaryLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors shrink-0"
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
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-white border border-purple-200/90 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-purple-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-800">{customerSummary.customer.name}</h4>
                  <span className="text-xs bg-purple-100 text-purple-800 font-mono font-bold px-2.5 py-0.5 rounded-full">
                    {customerSummary.customer.mobile}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{customerSummary.customer.address || 'Address not listed'}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onLookupCustomer && onLookupCustomer(customerSummary.customer.mobile)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View 360° Dossier</span>
                </button>
                <button
                  onClick={() => onNavigate('services')}
                  className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold"
                >
                  Go to Services
                </button>
              </div>
            </div>

            {/* Service & Payment Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-purple-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Registered Bikes</span>
                <span className="text-lg font-bold text-purple-900 mt-1 block">
                  {customerSummary.bikes.length} Vehicles
                </span>
                <div className="text-[11px] text-slate-600 font-mono mt-0.5 truncate">
                  {customerSummary.bikes.map((b) => b.registrationNumber).join(', ')}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Service History</span>
                <span className="text-lg font-bold text-emerald-700 mt-1 block">
                  {customerSummary.serviceSummary.completedServices} Completed
                </span>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {customerSummary.serviceSummary.activeServices} Active in workshop
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Total Billed & Paid</span>
                <span className="text-lg font-bold text-slate-800 mt-1 block">
                  ₹{customerSummary.paymentOverview.totalPaid.toLocaleString('en-IN')}
                </span>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Gross Billed: ₹{customerSummary.paymentOverview.totalBilled.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-purple-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Outstanding Balance</span>
                <span className={`text-lg font-bold mt-1 block ${customerSummary.paymentOverview.pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ₹{customerSummary.paymentOverview.pendingBalance.toLocaleString('en-IN')}
                </span>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Next Due: {customerSummary.serviceSummary.nextServiceDate ? new Date(customerSummary.serviceSummary.nextServiceDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers & Bikes */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Base</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{metrics.totalCustomers}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-purple-600" />
              <span className="font-semibold text-purple-900">{metrics.totalBikes}</span> Bikes registered
            </p>
          </div>
        </div>

        {/* Today's Service Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Bookings</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{metrics.todayBookings}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> {metrics.pendingServices} active
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {metrics.completedServices} ready
              </span>
            </div>
          </div>
        </div>

        {/* Today's Collection */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Collection</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">₹{metrics.todayCollection.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Monthly: <span className="font-semibold text-slate-700">₹{metrics.monthlyRevenue.toLocaleString('en-IN')}</span>
            </p>
          </div>
        </div>

        {/* Outstanding Payments */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Dues</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-rose-600">₹{metrics.outstandingPayments.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Across active & delivered service bills
            </p>
          </div>
        </div>
      </div>

      {/* Main Sections: Recent Services & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Job Cards (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-purple-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-purple-50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">Active & Recent Job Cards</h2>
                <p className="text-xs text-slate-500">Live service tracking and billing summary</p>
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

          <div className="overflow-x-auto">
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
                          <div className="text-[11px] text-purple-700 font-mono">
                            {srv.customer.mobile}
                          </div>
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
          <div className="p-5 border-b border-purple-50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">Service Reminders</h2>
                <p className="text-xs text-slate-500">Bikes scheduled for next periodic maintenance</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900"
            >
              Export
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[460px]">
            {data?.upcomingReminders?.length > 0 ? (
              data.upcomingReminders.map((rem) => {
                const dueDate = new Date(rem.nextServiceDate);
                const isOverdue = dueDate < new Date();
                return (
                  <div
                    key={rem._id}
                    className="p-3.5 rounded-xl border border-purple-100/80 hover:border-purple-300 bg-purple-50/20 hover:bg-purple-50/50 transition-all flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">
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
              <div className="py-12 text-center text-slate-400 text-sm">
                No upcoming service reminders in the next 30 days.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
