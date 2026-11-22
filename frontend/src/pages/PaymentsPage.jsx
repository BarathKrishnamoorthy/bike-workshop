import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  IndianRupee,
  Search,
  Plus,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  FileText,
  BadgeCheck,
  ChevronRight,
  Phone
} from 'lucide-react';
import api from '../services/api';

export default function PaymentsPage({ initialServiceForPayment, onLookupPhone }) {
  const [payments, setPayments] = useState([]);
  const [servicesWithBalance, setServicesWithBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(!!initialServiceForPayment);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceForPayment?._id || '');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentType, setPaymentType] = useState('Final');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentModalPhoneSearch, setPaymentModalPhoneSearch] = useState('');

  const fetchPayments = async (mobileParam = '') => {
    try {
      setLoading(true);
      const url = mobileParam ? `/payments?mobile=${encodeURIComponent(mobileParam)}` : '/payments';
      const res = await api.get(url);
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServicesForPayment = async () => {
    try {
      const res = await api.get('/services');
      if (res.data.success) {
        setServicesWithBalance(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching services for payment:', err);
    }
  };

  useEffect(() => {
    fetchPayments(phoneFilter);
    fetchServicesForPayment();
  }, [phoneFilter]);

  useEffect(() => {
    if (initialServiceForPayment) {
      setSelectedServiceId(initialServiceForPayment._id);
      setAmountPaid(initialServiceForPayment.pendingBalance || '');
      setShowRecordModal(true);
    }
  }, [initialServiceForPayment]);

  const selectedServiceObj = servicesWithBalance.find((s) => s._id === selectedServiceId);

  useEffect(() => {
    if (selectedServiceObj) {
      if (selectedServiceObj.pendingBalance > 0) {
        setAmountPaid(selectedServiceObj.pendingBalance);
        setPaymentType(selectedServiceObj.paidAmount > 0 ? 'Final' : 'Partial');
      } else {
        setAmountPaid(selectedServiceObj.totalAmount || 0);
      }
    }
  }, [selectedServiceId]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedServiceId || !amountPaid || Number(amountPaid) <= 0) {
      alert('Please select a service and enter a valid payment amount');
      return;
    }

    try {
      const payload = {
        serviceId: selectedServiceId,
        customerId: selectedServiceObj?.customer?._id,
        amountPaid: Number(amountPaid),
        paymentType,
        paymentMethod,
        transactionReference: transactionRef,
        notes,
      };

      const res = await api.post('/payments', payload);
      if (res.data.success) {
        setShowRecordModal(false);
        fetchPayments(phoneFilter);
        fetchServicesForPayment();
        setSelectedReceipt(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  // Calculations for KPI
  const totalCollected = payments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);
  const upiCollected = payments
    .filter((p) => p.paymentMethod === 'UPI')
    .reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);
  const cashCollected = payments
    .filter((p) => p.paymentMethod === 'Cash')
    .reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);

  const filteredPayments = payments.filter((p) => {
    const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;
    const matchesType = typeFilter === 'All' || p.paymentType === typeFilter;
    const matchesSearch =
      search === '' ||
      p.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.mobile?.includes(search) ||
      p.transactionReference?.toLowerCase().includes(search.toLowerCase());
    return matchesMethod && matchesType && matchesSearch;
  });

  const filteredModalServices = servicesWithBalance.filter((s) => {
    if (!paymentModalPhoneSearch) return true;
    const clean = paymentModalPhoneSearch.replace(/\D/g, '');
    return s.customer?.mobile?.replace(/\D/g, '').includes(clean) ||
           s.customer?.name?.toLowerCase().includes(paymentModalPhoneSearch.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Record Payment */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Payment Management & Invoicing</h1>
          <p className="text-slate-500 text-sm">Issue GST tax invoices, track customer payments by mobile number, reconcile balances</p>
        </div>
        <button
          onClick={() => {
            setSelectedServiceId('');
            setAmountPaid('');
            setPaymentModalPhoneSearch('');
            setShowRecordModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue Recorded</span>
          <h3 className="text-2xl font-bold text-purple-900 mt-2">₹{totalCollected.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-500 mt-1">{payments.length} successful payment transactions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">UPI / Online Collections</span>
          <h3 className="text-2xl font-bold text-emerald-700 mt-2">₹{upiCollected.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-500 mt-1">Google Pay, PhonePe, Paytm, QR</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-card">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cash Register Total</span>
          <h3 className="text-2xl font-bold text-blue-700 mt-2">₹{cashCollected.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-500 mt-1">Direct workshop physical counter cash</p>
        </div>
      </div>

      {/* Filter Toolbar with Phone Number Search */}
      <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Method & Type filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Method:</span>
          {['All', 'UPI', 'Cash', 'Card', 'Bank Transfer'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                methodFilter === m
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Dual Search: Phone Number Filter & General Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Module 4 Requirement: Dedicated Phone Number Filter */}
          <div className="relative w-full sm:w-56">
            <Phone className="w-3.5 h-3.5 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="Search by phone #..."
              className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden font-mono"
            />
            {phoneFilter && (
              <button onClick={() => setPhoneFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Invoice #, txn ref..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Payments: Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-card overflow-hidden">
        {/* Mobile View (Phones < md) */}
        <div className="md:hidden divide-y divide-purple-50">
          {loading ? (
            <div className="py-12 text-center text-purple-600 text-xs">
              <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Loading payment history...
            </div>
          ) : filteredPayments.length > 0 ? (
            filteredPayments.map((p) => (
              <div key={p._id} className="p-4 space-y-2.5 hover:bg-purple-50/20 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-700 font-mono text-xs">{p.invoiceNumber}</span>
                  <div className="text-[10px] text-slate-400">{new Date(p.paymentDate).toLocaleDateString()}</div>
                </div>

                <div className="flex items-start justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{p.customer?.name || 'Walk-in'}</div>
                    {p.customer?.mobile && (
                      <button
                        onClick={() => onLookupPhone && onLookupPhone(p.customer.mobile)}
                        className="text-[11px] text-purple-700 font-mono flex items-center gap-1 mt-0.5 underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{p.customer.mobile}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-emerald-600 text-sm">₹{p.amountPaid?.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {p.paymentMethod} • {p.paymentType}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-50 flex items-center justify-between text-xs">
                  <div>
                    {p.pendingBalance > 0 ? (
                      <span className="text-[11px] text-rose-600 font-bold">Balance: ₹{p.pendingBalance.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Fully Cleared
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedReceipt(p)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-1 border border-purple-200"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Receipt</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No payment transactions found matching filters.
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fcfaff] text-xs font-semibold text-purple-950 uppercase border-b border-purple-100">
              <tr>
                <th className="py-3.5 px-5">Invoice #</th>
                <th className="py-3.5 px-4">Customer & Phone</th>
                <th className="py-3.5 px-4">Job Card</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Transaction Ref</th>
                <th className="py-3.5 px-4 text-right">Amount Paid</th>
                <th className="py-3.5 px-4 text-right">Remaining Balance</th>
                <th className="py-3.5 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-purple-600">
                    <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading payments history...
                  </td>
                </tr>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-purple-700 font-mono text-sm">{p.invoiceNumber}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{p.customer?.name || 'Walk-in Customer'}</div>
                      {p.customer?.mobile ? (
                        <button
                          onClick={() => onLookupPhone && onLookupPhone(p.customer.mobile)}
                          className="text-xs text-purple-700 hover:text-purple-950 font-mono font-semibold flex items-center gap-1 mt-0.5 underline decoration-purple-300"
                          title="Click to view full customer service & payment dossier"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{p.customer.mobile}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No phone</span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-slate-700">
                      {p.service?.jobCardNumber || 'N/A'}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800">
                          {p.paymentType}
                        </span>
                        <span className="font-medium text-xs text-slate-700">
                          {p.paymentMethod}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-slate-600">
                      {p.transactionReference || 'Counter Cash'}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-emerald-600 text-sm">
                        ₹{p.amountPaid?.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      {p.pendingBalance > 0 ? (
                        <span className="text-xs font-semibold text-rose-600">
                          ₹{p.pendingBalance.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Nil
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-1 ml-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No payment transactions found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal with Phone Quick Search */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto flex min-h-full items-start sm:items-center justify-center p-2 sm:p-5 pt-3 sm:pt-5">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-purple-100 overflow-hidden my-auto flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-purple-100 bg-purple-700 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base sm:text-lg">Record Customer Payment</h3>
                <p className="text-xs text-purple-200">Collect advance, partial or final settlement</p>
              </div>
              <button onClick={() => setShowRecordModal(false)} className="text-purple-200 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Optional Phone filter in modal to quickly find customer's bills */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Filter Job Cards by Customer Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={paymentModalPhoneSearch}
                    onChange={(e) => setPaymentModalPhoneSearch(e.target.value)}
                    placeholder="Type phone or name to narrow list..."
                    className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-purple-200 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Select Service / Job Card to Settle *</label>
                <select
                  required
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden bg-white font-mono"
                >
                  <option value="">-- Choose Job Card to Settle --</option>
                  {filteredModalServices.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.jobCardNumber} - {s.customer?.name} ({s.customer?.mobile}) [Due: ₹{s.pendingBalance}]
                    </option>
                  ))}
                </select>
              </div>

              {selectedServiceObj && (
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <strong className="text-slate-800">{selectedServiceObj.customer?.name} ({selectedServiceObj.customer?.mobile})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Service Bill:</span>
                    <strong className="text-slate-800">₹{selectedServiceObj.totalAmount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Already Paid Previously:</span>
                    <strong className="text-emerald-700">₹{selectedServiceObj.paidAmount || 0}</strong>
                  </div>
                  <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-purple-200">
                    <span>Remaining Balance Due:</span>
                    <span>₹{selectedServiceObj.pendingBalance}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Amount Collecting (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden font-bold text-purple-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Payment Stage</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 outline-hidden bg-white"
                  >
                    <option value="Final">Final Payment</option>
                    <option value="Partial">Partial Payment</option>
                    <option value="Advance">Advance Payment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 outline-hidden bg-white"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Card">Debit / Credit Card (POS)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Transaction Ref / Cheque #</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UPI/12345678"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Internal Note / Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Balance settled before bike collection"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-purple-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200"
                >
                  Confirm & Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Invoice & Payment Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto flex min-h-full items-start sm:items-center justify-center p-2 sm:p-5 pt-3 sm:pt-5">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-purple-100 overflow-hidden flex flex-col my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[92vh]">
            <div className="p-4 bg-purple-800 text-white flex items-center justify-between no-print">
              <h3 className="font-bold text-sm">Tax Invoice & Payment Receipt</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-white text-purple-900 font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-purple-200 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 print-container text-slate-800 space-y-5 bg-white text-xs">
              <div className="border-b-2 border-purple-900 pb-4 text-center">
                <h2 className="text-lg font-black text-purple-950 uppercase tracking-tight">
                  SPEEDYWHEELS BIKE WORKSHOP
                </h2>
                <p className="text-slate-500">108 Workshop Road, Auto Hub, Bangalore - 560001</p>
                <p className="text-slate-500">GSTIN: 29ABCDE1234F1Z5 • Ph: +91 98765 43210</p>
                <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[11px] uppercase tracking-wider">
                  Payment Receipt & Bill of Supply
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-purple-100 pb-4">
                <div>
                  <span className="text-slate-400 block font-medium">Billed To:</span>
                  <div className="font-bold text-slate-900">{selectedReceipt.customer?.name}</div>
                  <div className="text-slate-600 font-mono">Mobile: {selectedReceipt.customer?.mobile}</div>
                  <div className="text-slate-600">Address: {selectedReceipt.customer?.address || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-900 font-mono text-sm">{selectedReceipt.invoiceNumber}</div>
                  <div className="text-slate-500">
                    Date: {new Date(selectedReceipt.paymentDate).toLocaleDateString()}
                  </div>
                  <div className="text-slate-500">
                    Mode: {selectedReceipt.paymentMethod}
                  </div>
                  {selectedReceipt.transactionReference && (
                    <div className="text-slate-500 font-mono text-[10px]">
                      Ref: {selectedReceipt.transactionReference}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 py-2">
                <div className="flex justify-between border-b border-purple-50 pb-2">
                  <span className="font-semibold text-slate-700">Total Bill Amount:</span>
                  <strong className="text-slate-900 font-bold">₹{selectedReceipt.totalAmount?.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between border-b border-purple-50 pb-2 text-emerald-700 font-bold text-sm">
                  <span>Amount Paid (This Transaction):</span>
                  <span>₹{selectedReceipt.amountPaid?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Pending Balance Outstanding:</span>
                  <span>₹{selectedReceipt.pendingBalance?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-purple-900 font-semibold">
                  <BadgeCheck className="w-5 h-5 text-purple-700" />
                  <span>Payment Stage: {selectedReceipt.paymentType}</span>
                </div>
                <span className="font-bold text-purple-900">
                  {selectedReceipt.pendingBalance === 0 ? 'STATUS: PAID IN FULL' : 'STATUS: PARTIAL PAYMENT'}
                </span>
              </div>

              <div className="pt-6 border-t border-slate-200 text-center text-slate-400 text-[11px] space-y-1">
                <p>Thank you for choosing SpeedyWheels Bike Workshop!</p>
                <p>Helpline: +91 98765 43210 • All service works carry a 30-day warranty.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
