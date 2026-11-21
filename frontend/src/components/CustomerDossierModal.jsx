import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Bike,
  Wrench,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  PlusCircle,
  ArrowRight,
  Clock,
  IndianRupee
} from 'lucide-react';
import api from '../services/api';

export default function CustomerDossierModal({
  mobile,
  onClose,
  onCreateJobCard,
  onRecordPayment,
  onOpenReport
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mobile) return;
    const fetchDossier = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/reports/customer-dossier/${encodeURIComponent(mobile)}`);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error loading customer dossier:', err);
        setError(err.response?.data?.message || 'Customer record not found for this mobile number.');
      } finally {
        setLoading(false);
      }
    };

    fetchDossier();
  }, [mobile]);

  const handleExportCSV = () => {
    if (!mobile) return;
    const token = localStorage.getItem('token');
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const downloadUrl = `${apiBase}/reports/customer-dossier/${encodeURIComponent(mobile)}?format=csv`;

    fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customer-${mobile}-service-history.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => alert('Failed to download CSV report'));
  };

  const statusColors = {
    'Booked': 'bg-blue-50 text-blue-700 border-blue-200',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
    'Ready': 'bg-purple-50 text-purple-700 border-purple-200',
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-200 bg-white/15 px-2 py-0.5 rounded">
                  Customer 360° Identification
                </span>
                <span className="text-xs text-purple-200 font-mono font-semibold">
                  {mobile}
                </span>
              </div>
              <h3 className="text-xl font-bold tracking-tight mt-0.5">
                {data?.customer?.name || 'Customer Profile'}
              </h3>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              title="Export Customer History to Excel CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              title="Print Customer Service Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 print-container text-slate-800">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-purple-900">
                Retrieving customer details, bikes, and service history...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No Customer Found</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Quick Action Navigation Bar */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl no-print">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider mr-2">
                  Direct Actions:
                </span>
                <button
                  onClick={() => {
                    if (onCreateJobCard) onCreateJobCard(data.customer._id, data.bikes[0]?._id);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ New Job Card for this Bike</span>
                </button>
                {data.summary?.pendingBalance > 0 && onRecordPayment && (
                  <button
                    onClick={() => {
                      onRecordPayment(data.customer);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1"
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Settle Dues (₹{data.summary.pendingBalance.toLocaleString('en-IN')})</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    if (onOpenReport) onOpenReport(data.customer.mobile);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-purple-700 border border-purple-200 hover:bg-purple-100 flex items-center gap-1 ml-auto"
                >
                  <span>Detailed Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Requirement 3: Customer & KPI Metric Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-card">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Customer Info</span>
                  <h4 className="text-base font-bold text-slate-800 mt-1 truncate">{data.customer.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-purple-700 font-mono mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{data.customer.mobile}</span>
                  </div>
                  {data.customer.address && (
                    <div className="text-[11px] text-slate-500 mt-1 truncate" title={data.customer.address}>
                      {data.customer.address}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-card">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Registered Bikes</span>
                  <h4 className="text-2xl font-bold text-purple-900 mt-1">{data.summary.totalRegisteredBikes}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Vehicles in garage profile</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-card">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Services Completed</span>
                  <h4 className="text-2xl font-bold text-emerald-700 mt-1">{data.summary.totalServicesCompleted}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Of {data.summary.totalServicesRecorded} total visits</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-card">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Payment</span>
                  <h4 className={`text-2xl font-bold mt-1 ${data.summary.pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{data.summary.pendingBalance.toLocaleString('en-IN')}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Paid: <strong className="text-slate-700">₹{data.summary.totalPaid.toLocaleString('en-IN')}</strong>
                  </p>
                </div>
              </div>

              {/* Next Service Date Alert Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                      Next Scheduled Periodic Maintenance
                    </h5>
                    <p className="text-xs text-amber-800 font-medium">
                      Target Due Date: <strong className="font-bold underline">{data.summary.nextServiceDate}</strong>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-900 self-start sm:self-auto">
                  Automatic Reminder Active
                </span>
              </div>

              {/* Registered Bikes Section */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
                  <Bike className="w-4 h-4 text-purple-600" />
                  <span>Customer's Registered Bikes ({data.bikes?.length || 0})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {data.bikes?.map((b) => (
                    <div
                      key={b._id}
                      className="p-3.5 rounded-2xl border border-purple-100 bg-[#fdfcff] hover:border-purple-300 transition-all shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">{b.brand} {b.model}</span>
                        <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded font-mono uppercase">
                          {b.registrationNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                        <div>Odometer Reading: <strong className="text-slate-700 font-mono">{b.currentKilometre} KM</strong></div>
                        <div>Year / Fuel: {b.year || 'N/A'} • {b.fuelType || 'Petrol'}</div>
                        {b.color && <div>Color: {b.color}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complete Service History (Requirement 3 details) */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-purple-600" />
                  <span>Service History & Work Performed</span>
                </h4>

                <div className="border border-purple-100 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#fcfaff] font-bold text-purple-950 uppercase border-b border-purple-100">
                        <tr>
                          <th className="py-3 px-3.5">Job Card</th>
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Bike Reg #</th>
                          <th className="py-3 px-3">Services Performed</th>
                          <th className="py-3 px-3 text-right">Bill Amount</th>
                          <th className="py-3 px-3 text-right">Paid</th>
                          <th className="py-3 px-3 text-right">Balance</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3">Next Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50">
                        {data.serviceHistory && data.serviceHistory.length > 0 ? (
                          data.serviceHistory.map((s, idx) => (
                            <tr key={idx} className="hover:bg-purple-50/40 transition-colors">
                              <td className="py-3 px-3.5 font-bold font-mono text-purple-700">{s.jobCardNumber}</td>
                              <td className="py-3 px-3 text-slate-600">{s.serviceDate}</td>
                              <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                                {s.bikeRegistrationNumber}
                              </td>
                              <td className="py-3 px-3 max-w-xs text-slate-700 truncate" title={s.servicesPerformed}>
                                {s.servicesPerformed}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-slate-800">
                                ₹{s.previousServiceAmount?.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                                ₹{s.amountPaid?.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-3 text-right font-bold">
                                {s.pendingPaymentAmount > 0 ? (
                                  <span className="text-rose-600">₹{s.pendingPaymentAmount.toLocaleString('en-IN')}</span>
                                ) : (
                                  <span className="text-emerald-600">Nil</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[s.serviceStatus] || 'bg-slate-100 text-slate-600'}`}>
                                  {s.serviceStatus}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-500 font-medium">{s.nextServiceDate}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="9" className="py-8 text-center text-slate-400">
                              No previous service history found for this customer.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Quick Actions */}
        {data && !loading && (
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-purple-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:inline">Quick Actions:</span>
              <button
                type="button"
                onClick={() => onCreateJobCard && onCreateJobCard(data.customer, data.bikes)}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Job Card</span>
              </button>
              <button
                type="button"
                onClick={() => onRecordPayment && onRecordPayment(data.customer)}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Settle Payment</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onOpenReport && onOpenReport(mobile)}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <span>Full Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
