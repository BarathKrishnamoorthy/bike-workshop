import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Calendar,
  Clock,
  Printer,
  CreditCard,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  PlusCircle,
  Bike,
  User,
  IndianRupee,
  ChevronDown,
  Phone,
  FileText
} from 'lucide-react';
import api from '../services/api';

export default function ServicesPage({ initialOpenNew, onOpenPaymentForService, onLookupPhone }) {
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(initialOpenNew || false);
  const [selectedJobCardForPrint, setSelectedJobCardForPrint] = useState(null);

  // Form State for New Job Card
  const [lookupPhoneInput, setLookupPhoneInput] = useState('');
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);
  const [foundCustomerDossier, setFoundCustomerDossier] = useState(null);
  const [lookupMessage, setLookupMessage] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedBikeId, setSelectedBikeId] = useState('');
  const [serviceType, setServiceType] = useState('General Service');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [complaintText, setComplaintText] = useState('');
  const [complaintsList, setComplaintsList] = useState([]);
  const [workPerformed, setWorkPerformed] = useState('');
  const [currentKilometre, setCurrentKilometre] = useState('');
  const [assignedMechanic, setAssignedMechanic] = useState('Chief Mechanic');
  const [discount, setDiscount] = useState(0);
  const [paidAdvance, setPaidAdvance] = useState(0);
  const [notes, setNotes] = useState('');
  const [taxMode, setTaxMode] = useState('without_tax'); // 'without_tax' or 'with_tax'
  const [selectedTaxRate, setSelectedTaxRate] = useState(18);

  // Dynamic Line Items
  const [spareParts, setSpareParts] = useState([
    { name: '', partNumber: '', quantity: 1, unitPrice: 0 },
  ]);
  const [labourCharges, setLabourCharges] = useState([
    { description: 'General Service & Inspection', amount: 650 },
  ]);

  const fetchServices = async (mobileFilterParam = '') => {
    try {
      setLoading(true);
      const url = mobileFilterParam ? `/services?mobile=${encodeURIComponent(mobileFilterParam)}` : '/services';
      const res = await api.get(url);
      if (res.data.success) {
        setServices(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  useEffect(() => {
    fetchServices(phoneFilter);
    fetchCustomers();
  }, [phoneFilter]);

  // Phone lookup helper in New Job Card modal
  const handlePhoneLookupInJobCard = async (phoneVal) => {
    const clean = phoneVal.replace(/\D/g, '');
    if (clean.length >= 10) {
      try {
        setPhoneLookupLoading(true);
        setLookupMessage('');
        const res = await api.get(`/customers/lookup/${clean}`);
        if (res.data.success && res.data.data?.customer) {
          const cust = res.data.data.customer;
          setFoundCustomerDossier(res.data.data);
          setSelectedCustomerId(cust._id);
          if (res.data.data.bikes?.length > 0) {
            setSelectedBikeId(res.data.data.bikes[0]._id);
            if (res.data.data.bikes[0].currentKilometre) {
              setCurrentKilometre(res.data.data.bikes[0].currentKilometre);
            }
          }
          setLookupMessage(`Verified Customer: ${cust.name}`);
        } else {
          setFoundCustomerDossier(null);
          setLookupMessage('No registered customer found for this mobile number.');
        }
      } catch (err) {
        setFoundCustomerDossier(null);
        setLookupMessage('No customer record exists with this mobile number. You can select an existing one below or register a new customer.');
      } finally {
        setPhoneLookupLoading(false);
      }
    } else {
      setFoundCustomerDossier(null);
      setLookupMessage('');
    }
  };

  // Filtered bikes based on selected customer
  const selectedCustomerObj = customers.find((c) => c._id === selectedCustomerId) || foundCustomerDossier?.customer;
  const customerBikes = foundCustomerDossier && foundCustomerDossier.customer?._id === selectedCustomerId
    ? foundCustomerDossier.bikes
    : selectedCustomerObj?.bikes || [];

  // When customer changes, pick first bike by default
  useEffect(() => {
    if (customerBikes.length > 0) {
      const firstBike = customerBikes[0];
      setSelectedBikeId(firstBike._id || firstBike);
      if (firstBike.currentKilometre) {
        setCurrentKilometre(firstBike.currentKilometre);
      }
    } else {
      setSelectedBikeId('');
      setCurrentKilometre('');
    }
  }, [selectedCustomerId]);

  // Handle complaint tag add
  const handleAddComplaint = (e) => {
    e.preventDefault();
    if (complaintText.trim()) {
      setComplaintsList([...complaintsList, complaintText.trim()]);
      setComplaintText('');
    }
  };

  const handleRemoveComplaint = (index) => {
    setComplaintsList(complaintsList.filter((_, i) => i !== index));
  };

  // Dynamic Spare Parts handlers
  const handleAddSparePart = () => {
    setSpareParts([...spareParts, { name: '', partNumber: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleUpdateSparePart = (index, field, value) => {
    const updated = [...spareParts];
    updated[index][field] = value;
    setSpareParts(updated);
  };

  const handleRemoveSparePart = (index) => {
    setSpareParts(spareParts.filter((_, i) => i !== index));
  };

  // Dynamic Labour handlers
  const handleAddLabour = () => {
    setLabourCharges([...labourCharges, { description: '', amount: 0 }]);
  };

  const handleUpdateLabour = (index, field, value) => {
    const updated = [...labourCharges];
    updated[index][field] = value;
    setLabourCharges(updated);
  };

  const handleRemoveLabour = (index) => {
    setLabourCharges(labourCharges.filter((_, i) => i !== index));
  };

  // Calculation helpers
  const calculatedPartsTotal = spareParts.reduce(
    (acc, p) => acc + (Number(p.quantity || 1) * Number(p.unitPrice || 0)),
    0
  );
  const calculatedLabourTotal = labourCharges.reduce(
    (acc, l) => acc + Number(l.amount || 0),
    0
  );
  const subtotal = Math.max(0, calculatedPartsTotal + calculatedLabourTotal - Number(discount || 0));
  const effectiveTaxRate = taxMode === 'with_tax' ? Number(selectedTaxRate || 18) : 0;
  const taxAmount = effectiveTaxRate > 0 ? Math.round((subtotal * effectiveTaxRate) / 100) : 0;
  const calculatedTotal = subtotal + taxAmount;
  const balanceDue = Math.max(0, calculatedTotal - Number(paidAdvance || 0));

  const handleCreateJobCard = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedBikeId) {
      alert('Please select both Customer and Bike');
      return;
    }

    try {
      const payload = {
        customerId: selectedCustomerId,
        bikeId: selectedBikeId,
        serviceDate,
        deliveryDate,
        serviceType,
        customerComplaints: complaintsList,
        workPerformed,
        spareParts: spareParts.filter((p) => p.name.trim() !== ''),
        labourCharges: labourCharges.filter((l) => l.description.trim() !== ''),
        discount: Number(discount) || 0,
        taxRate: effectiveTaxRate,
        currentKilometre: Number(currentKilometre) || 0,
        assignedMechanic,
        paidAmount: Number(paidAdvance) || 0,
        notes,
        status: 'Booked',
      };

      const res = await api.post('/services', payload);
      if (res.data.success) {
        setShowCreateModal(false);
        fetchServices(phoneFilter);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate Job Card');
    }
  };

  const handleUpdateStatus = async (serviceId, newStatus) => {
    try {
      const res = await api.patch(`/services/${serviceId}/status`, { status: newStatus });
      if (res.data.success) {
        fetchServices(phoneFilter);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const statusColors = {
    'Booked': 'bg-blue-50 text-blue-700 border-blue-200',
    'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
    'Ready': 'bg-purple-50 text-purple-700 border-purple-200',
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const filteredServices = services.filter((s) => {
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesSearch =
      search === '' ||
      s.jobCardNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.customer?.mobile?.includes(search) ||
      s.bike?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.serviceType?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Service Management & Job Cards</h1>
          <p className="text-slate-500 text-sm">Issue job cards, retrieve service history by phone number, track workshop stages</p>
        </div>
        <button
          onClick={() => {
            setFoundCustomerDossier(null);
            setLookupPhoneInput('');
            setShowCreateModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Job Card</span>
        </button>
      </div>

      {/* Module 3 Requirement: Phone Number Filter & Status Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Pill Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {['All', 'Booked', 'In Progress', 'Ready', 'Delivered'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dual Search: Phone Number Filter & General Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Dedicated Customer Phone Filter */}
          <div className="relative w-full sm:w-56">
            <Phone className="w-3.5 h-3.5 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="Filter by phone #..."
              className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden font-mono"
            />
            {phoneFilter && (
              <button onClick={() => setPhoneFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* General Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search JC #, bike..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Services List: Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-card overflow-hidden">
        {/* Mobile Job Cards View (Phones < md) */}
        <div className="md:hidden divide-y divide-purple-50">
          {loading ? (
            <div className="py-12 text-center text-purple-600 text-xs">
              <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Loading job cards...
            </div>
          ) : filteredServices.length > 0 ? (
            filteredServices.map((srv) => (
              <div key={srv._id} className="p-4 space-y-3 hover:bg-purple-50/20 transition-colors">
                {/* Header: Job Card #, Date, Status */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-purple-700 font-mono text-xs">{srv.jobCardNumber}</span>
                    <div className="text-[10px] text-slate-400">{new Date(srv.serviceDate).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={srv.status}
                      onChange={(e) => handleUpdateStatus(srv._id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border cursor-pointer outline-hidden ${statusColors[srv.status]}`}
                    >
                      <option value="Booked">Booked</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Ready">Ready</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Customer & Vehicle */}
                <div className="flex items-start justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{srv.customer?.name || 'Walk-in Customer'}</div>
                    {srv.customer?.mobile && (
                      <button
                        onClick={() => onLookupPhone && onLookupPhone(srv.customer.mobile)}
                        className="text-[11px] text-purple-700 font-mono font-semibold flex items-center gap-1 mt-0.5 underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{srv.customer.mobile}</span>
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-800 font-mono">
                      {srv.bike ? `${srv.bike.brand} ${srv.bike.model}` : 'Bike N/A'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {srv.bike?.registrationNumber || ''}
                    </div>
                  </div>
                </div>

                {/* Service Details & Complaints */}
                <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100/60 text-xs flex items-center justify-between gap-2">
                  <span className="font-semibold text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-200">
                    {srv.serviceType}
                  </span>
                  {srv.currentKilometre > 0 && (
                    <span className="text-[11px] text-slate-600 font-mono">
                      {srv.currentKilometre} KM
                    </span>
                  )}
                </div>

                {/* Financial Summary & Quick Actions */}
                <div className="pt-2 border-t border-purple-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Total: ₹{srv.totalAmount?.toLocaleString('en-IN')}
                    </div>
                    {srv.pendingBalance > 0 ? (
                      <div className="text-[11px] text-rose-600 font-bold">
                        Due: ₹{srv.pendingBalance.toLocaleString('en-IN')}
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-600 font-semibold">Fully Paid</div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {srv.pendingBalance > 0 && onOpenPaymentForService && (
                      <button
                        onClick={() => onOpenPaymentForService(srv)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                      >
                        Pay
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedJobCardForPrint(srv)}
                      className="p-1.5 rounded-xl text-purple-700 hover:bg-purple-100 border border-purple-200"
                      title="Print Job Card"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No services found matching filters.
            </div>
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fcfaff] text-xs font-semibold text-purple-950 uppercase border-b border-purple-100">
              <tr>
                <th className="py-3.5 px-5">Job Card</th>
                <th className="py-3.5 px-4">Customer & Mobile</th>
                <th className="py-3.5 px-4">Vehicle</th>
                <th className="py-3.5 px-4">Service Details</th>
                <th className="py-3.5 px-4">Status & Mechanic</th>
                <th className="py-3.5 px-4 text-right">Amount / Balance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-purple-600">
                    <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading job cards...
                  </td>
                </tr>
              ) : filteredServices.length > 0 ? (
                filteredServices.map((srv) => (
                  <tr key={srv._id} className="hover:bg-purple-50/40 transition-colors">
                    {/* Job Card Number */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-purple-700 font-mono text-sm">{srv.jobCardNumber}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(srv.serviceDate).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Customer & Mobile */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{srv.customer?.name || 'Walk-in Customer'}</div>
                      {srv.customer?.mobile ? (
                        <button
                          onClick={() => onLookupPhone && onLookupPhone(srv.customer.mobile)}
                          className="text-xs text-purple-700 hover:text-purple-950 font-mono font-semibold flex items-center gap-1 mt-0.5 underline decoration-purple-300"
                          title="Click to view full customer service history dossier"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{srv.customer.mobile}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No phone</span>
                      )}
                    </td>

                    {/* Vehicle */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800 font-mono text-xs">
                        {srv.bike ? `${srv.bike.brand} ${srv.bike.model}` : 'Bike details missing'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {srv.bike?.registrationNumber || 'N/A'}
                      </div>
                      {srv.currentKilometre > 0 && (
                        <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                          Meter: {srv.currentKilometre} KM
                        </div>
                      )}
                    </td>

                    {/* Service Type & Complaints */}
                    <td className="py-4 px-4 max-w-xs">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-800">
                        {srv.serviceType}
                      </span>
                      {srv.customerComplaints && srv.customerComplaints.length > 0 && (
                        <div className="text-xs text-slate-500 mt-1 truncate" title={srv.customerComplaints.join(', ')}>
                          ⚠️ {srv.customerComplaints.join(', ')}
                        </div>
                      )}
                    </td>

                    {/* Status & Mechanic */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1.5">
                        <select
                          value={srv.status}
                          onChange={(e) => handleUpdateStatus(srv._id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-hidden ${statusColors[srv.status]}`}
                        >
                          <option value="Booked">Booked</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Ready">Ready</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <span className="text-[11px] text-slate-400">
                          Mech: {srv.assignedMechanic || 'Chief Mechanic'}
                        </span>
                      </div>
                    </td>

                    {/* Amount & Balance */}
                    <td className="py-4 px-4 text-right">
                      <div className="font-bold text-slate-800">₹{srv.totalAmount?.toLocaleString('en-IN')}</div>
                      {srv.pendingBalance > 0 ? (
                        <div className="text-xs text-rose-600 font-bold">
                          Due: ₹{srv.pendingBalance.toLocaleString('en-IN')}
                        </div>
                      ) : (
                        <div className="text-[11px] text-emerald-600 font-semibold">Paid in Full</div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {srv.pendingBalance > 0 && onOpenPaymentForService && (
                          <button
                            onClick={() => onOpenPaymentForService(srv)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                            title="Collect payment for this service"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedJobCardForPrint(srv)}
                          className="p-1.5 rounded-lg text-purple-700 hover:bg-purple-50 transition-colors"
                          title="Print / View Job Card"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No services found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Job Card Modal with Phone-Based Customer Identification */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto flex min-h-full items-start sm:items-center justify-center p-2 sm:p-5 pt-3 sm:pt-5">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl border border-purple-100 overflow-hidden flex flex-col my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[92vh]">
            <div className="p-5 border-b border-purple-100 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Generate Job Card & Service Booking</h3>
                <p className="text-xs text-purple-200">Customer phone identification, spare parts allocation, labour charges and schedule</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-purple-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJobCard} className="p-6 overflow-y-auto space-y-6">
              {/* Common Identification Section: Enter Phone Number */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-purple-700" />
                  <span>Step 1: Identify Customer by Mobile Number</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={lookupPhoneInput}
                    onChange={(e) => {
                      setLookupPhoneInput(e.target.value);
                      handlePhoneLookupInJobCard(e.target.value);
                    }}
                    placeholder="Enter 10-digit customer mobile number (e.g. 9845012345)..."
                    className="flex-1 text-sm px-3.5 py-2 rounded-xl border border-purple-300 focus:border-purple-600 focus:bg-white outline-hidden font-mono bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handlePhoneLookupInJobCard(lookupPhoneInput)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                  >
                    {phoneLookupLoading ? 'Finding...' : 'Identify'}
                  </button>
                </div>

                {/* Feedback Banner */}
                {lookupMessage && !foundCustomerDossier && (
                  <p className="text-xs text-slate-500 italic">{lookupMessage}</p>
                )}

                {/* Returning Customer Summary Snapshot */}
                {foundCustomerDossier && (
                  <div className="p-3.5 rounded-xl bg-white border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-sm text-slate-800">
                          {foundCustomerDossier.customer.name}
                        </span>
                        <span className="text-xs font-mono text-purple-700 font-semibold">
                          ({foundCustomerDossier.customer.mobile})
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                        Returning Customer
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1 border-t border-purple-50">
                      <div>
                        Registered Bikes: <strong className="text-slate-800">{foundCustomerDossier.bikes.length}</strong>
                      </div>
                      <div>
                        Services Done: <strong className="text-slate-800">{foundCustomerDossier.summary.totalServicesCompleted}</strong>
                      </div>
                      <div>
                        Total Lifetime: <strong className="text-slate-800">₹{foundCustomerDossier.summary.totalBilled}</strong>
                      </div>
                      <div>
                        Pending Due: <strong className={foundCustomerDossier.summary.pendingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          ₹{foundCustomerDossier.summary.pendingBalance}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 1: Customer & Bike Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Customer Profile *</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden bg-white"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.mobile})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Select Registered Bike *</label>
                  <select
                    required
                    value={selectedBikeId}
                    onChange={(e) => setSelectedBikeId(e.target.value)}
                    disabled={!selectedCustomerId || customerBikes.length === 0}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden bg-white disabled:bg-slate-50 disabled:text-slate-400 font-mono"
                  >
                    <option value="">-- Select Registered Bike --</option>
                    {customerBikes.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.brand} {b.model} - {b.registrationNumber} ({b.currentKilometre} KM)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 2: Service Details */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 outline-hidden bg-white"
                  >
                    <option value="General Service">General Service</option>
                    <option value="Engine Oil & Filter Change">Engine Oil & Filter Change</option>
                    <option value="Brake Overhaul">Brake Overhaul</option>
                    <option value="Chain & Sprocket Replacement">Chain & Sprocket</option>
                    <option value="Major Engine Overhaul">Major Engine Overhaul</option>
                    <option value="Electrical & Wiring Repair">Electrical & Wiring</option>
                    <option value="Suspension & Fork Servicing">Suspension & Fork</option>
                    <option value="Inspection & Washing">Inspection & Washing</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Service Date</label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Target Delivery</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Current Odo KM</label>
                  <input
                    type="number"
                    value={currentKilometre}
                    onChange={(e) => setCurrentKilometre(e.target.value)}
                    placeholder="e.g. 15400"
                    className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 outline-hidden"
                  />
                </div>
              </div>

              {/* Section 3: Customer Complaints Tags */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Customer Complaints & Symptoms</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    placeholder="e.g. Squeaking brake noise, hard clutch lever, sluggish pickup"
                    className="flex-1 text-sm px-3.5 py-2 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddComplaint(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddComplaint}
                    className="px-3.5 py-2 rounded-xl bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs font-bold"
                  >
                    + Add
                  </button>
                </div>

                {complaintsList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {complaintsList.map((comp, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200"
                      >
                        <span>{comp}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveComplaint(idx)}
                          className="text-purple-400 hover:text-purple-700 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 4: Spare Parts Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
                    Spare Parts Required ({spareParts.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSparePart}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Spare Part</span>
                  </button>
                </div>

                <div className="border border-purple-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-purple-50/60 font-semibold text-purple-950">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5 w-28">Part #</th>
                        <th className="p-2.5 w-20">Qty</th>
                        <th className="p-2.5 w-24">Unit Price (₹)</th>
                        <th className="p-2.5 w-24 text-right">Total (₹)</th>
                        <th className="p-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {spareParts.map((part, index) => (
                        <tr key={index} className="bg-white">
                          <td className="p-2">
                            <input
                              type="text"
                              value={part.name}
                              onChange={(e) => handleUpdateSparePart(index, 'name', e.target.value)}
                              placeholder="e.g. Motul 15W50 Engine Oil"
                              className="w-full text-xs p-1.5 rounded border border-purple-200 outline-hidden"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={part.partNumber}
                              onChange={(e) => handleUpdateSparePart(index, 'partNumber', e.target.value)}
                              placeholder="MOT-15W"
                              className="w-full text-xs p-1.5 rounded border border-purple-200 outline-hidden"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={part.quantity}
                              onChange={(e) => handleUpdateSparePart(index, 'quantity', e.target.value)}
                              className="w-full text-xs p-1.5 rounded border border-purple-200 outline-hidden"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={part.unitPrice}
                              onChange={(e) => handleUpdateSparePart(index, 'unitPrice', e.target.value)}
                              className="w-full text-xs p-1.5 rounded border border-purple-200 outline-hidden"
                            />
                          </td>
                          <td className="p-2 text-right font-bold text-slate-700">
                            ₹{(Number(part.quantity || 1) * Number(part.unitPrice || 0)).toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSparePart(index)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5: Labour Charges Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
                    Labour & Service Tasks ({labourCharges.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLabour}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Labour Task</span>
                  </button>
                </div>

                <div className="border border-purple-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-purple-50/60 font-semibold text-purple-950">
                      <tr>
                        <th className="p-2.5">Task Description</th>
                        <th className="p-2.5 w-32 text-right">Amount (₹)</th>
                        <th className="p-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {labourCharges.map((lab, index) => (
                        <tr key={index} className="bg-white">
                          <td className="p-2">
                            <input
                              type="text"
                              value={lab.description}
                              onChange={(e) => handleUpdateLabour(index, 'description', e.target.value)}
                              placeholder="e.g. Brake Caliper Cleaning & Bleeding"
                              className="w-full text-xs p-1.5 rounded border border-purple-200 outline-hidden"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={lab.amount}
                              onChange={(e) => handleUpdateLabour(index, 'amount', e.target.value)}
                              className="w-full text-xs p-1.5 rounded border border-purple-200 outline-hidden text-right"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLabour(index)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 6: Bill Totals & Advance */}
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Assigned Mechanic</label>
                    <input
                      type="text"
                      value={assignedMechanic}
                      onChange={(e) => setAssignedMechanic(e.target.value)}
                      className="w-full p-2 bg-white rounded-lg border border-purple-200 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Advance Token Payment Received (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={paidAdvance}
                      onChange={(e) => setPaidAdvance(e.target.value)}
                      placeholder="0"
                      className="w-full p-2 bg-white rounded-lg border border-purple-200 outline-hidden font-bold text-emerald-700"
                    />
                  </div>

                  {/* Ask With Tax or Without Tax Option */}
                  <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-xs">GST Tax Option:</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${taxMode === 'with_tax' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'}`}>
                        {taxMode === 'with_tax' ? `With Tax (${effectiveTaxRate}%)` : 'Without Tax (0%)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTaxMode('without_tax')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                          taxMode === 'without_tax'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${taxMode === 'without_tax' ? 'border-white bg-white' : 'border-slate-400'}`}>
                          {taxMode === 'without_tax' && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                        </span>
                        <span>Without Tax</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaxMode('with_tax')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                          taxMode === 'with_tax'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${taxMode === 'with_tax' ? 'border-white bg-white' : 'border-slate-400'}`}>
                          {taxMode === 'with_tax' && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                        </span>
                        <span>With Tax</span>
                      </button>
                    </div>

                    {taxMode === 'with_tax' && (
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600">
                        <span>GST Slab:</span>
                        <select
                          value={selectedTaxRate}
                          onChange={(e) => setSelectedTaxRate(Number(e.target.value))}
                          className="px-2 py-1 rounded-lg border border-purple-200 text-xs font-bold text-purple-900 bg-purple-50/50"
                        >
                          <option value={18}>18% GST (Standard)</option>
                          <option value={12}>12% GST</option>
                          <option value={5}>5% GST</option>
                          <option value={28}>28% GST</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-right font-medium text-slate-600 flex flex-col justify-end">
                  <div className="flex justify-between">
                    <span>Spare Parts:</span>
                    <strong className="text-slate-800">₹{calculatedPartsTotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Labour Charges:</span>
                    <strong className="text-slate-800">₹{calculatedLabourTotal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Discount (₹):</span>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-20 p-1 text-right bg-white rounded border border-purple-200 text-xs"
                    />
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="flex items-center gap-1">
                      {taxMode === 'with_tax' ? `GST Tax (${effectiveTaxRate}%):` : 'Tax (Without Tax):'}
                    </span>
                    <strong className={taxAmount > 0 ? "text-slate-800" : "text-emerald-700"}>
                      {taxAmount > 0 ? `₹${taxAmount.toLocaleString('en-IN')}` : '₹0 (Nil)'}
                    </strong>
                  </div>
                  <div className="pt-2 border-t border-purple-200 flex justify-between text-sm font-bold text-purple-900">
                    <span>Total Estimate:</span>
                    <span>₹{calculatedTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-rose-600">
                    <span>Pending Balance:</span>
                    <span>₹{balanceDue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-purple-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200"
                >
                  Create & Print Job Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Job Card Modal */}
      {selectedJobCardForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto flex min-h-full items-start sm:items-center justify-center p-2 sm:p-5 pt-3 sm:pt-5">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-purple-100 overflow-hidden flex flex-col my-auto max-h-[calc(100dvh-1.5rem)] sm:max-h-[92vh]">
            <div className="p-4 bg-purple-800 text-white flex items-center justify-between no-print">
              <h3 className="font-bold text-base">Workshop Job Card Preview</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-white text-purple-900 font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setSelectedJobCardForPrint(null)}
                  className="text-purple-200 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 print-container text-slate-800 space-y-6 bg-white">
              <div className="border-b-2 border-purple-800 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-purple-900 tracking-tight">SPEEDYWHEELS BIKE WORKSHOP</h2>
                  <p className="text-xs text-slate-500">108 Workshop Road, Auto Hub, Bangalore - 560001</p>
                  <p className="text-xs text-slate-500">Phone: +91 98765 43210 • GSTIN: 29ABCDE1234F1Z5</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 font-bold font-mono text-sm rounded">
                    {selectedJobCardForPrint.jobCardNumber}
                  </span>
                  <div className="text-xs text-slate-500 mt-1">
                    Date: {new Date(selectedJobCardForPrint.serviceDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-xs">
                <div>
                  <h4 className="font-bold text-purple-900 uppercase tracking-wider mb-1">Customer Information</h4>
                  <p className="font-semibold text-slate-800">{selectedJobCardForPrint.customer?.name}</p>
                  <p className="text-slate-600 font-mono">Mobile: {selectedJobCardForPrint.customer?.mobile}</p>
                  <p className="text-slate-600">Address: {selectedJobCardForPrint.customer?.address || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-purple-900 uppercase tracking-wider mb-1">Vehicle Information</h4>
                  <p className="font-semibold text-slate-800 font-mono">
                    {selectedJobCardForPrint.bike?.brand} {selectedJobCardForPrint.bike?.model}
                  </p>
                  <p className="text-slate-600 font-mono">Reg #: {selectedJobCardForPrint.bike?.registrationNumber}</p>
                  <p className="text-slate-600">Kilometre: {selectedJobCardForPrint.currentKilometre} KM</p>
                </div>
              </div>

              {selectedJobCardForPrint.customerComplaints?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase mb-1">Customer Complaints Reported:</h4>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                    {selectedJobCardForPrint.customerComplaints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase mb-2">Estimated Parts & Labour Charges:</h4>
                  <table className="w-full text-left border-collapse border border-purple-200">
                    <thead className="bg-purple-100 text-purple-950 font-bold">
                      <tr>
                        <th className="p-2 border border-purple-200">Description</th>
                        <th className="p-2 border border-purple-200 w-16 text-center">Qty</th>
                        <th className="p-2 border border-purple-200 w-24 text-right">Rate</th>
                        <th className="p-2 border border-purple-200 w-24 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedJobCardForPrint.spareParts?.map((p, i) => (
                        <tr key={i} className="border border-purple-200">
                          <td className="p-2 border border-purple-200">{p.name} {p.partNumber ? `(${p.partNumber})` : ''}</td>
                          <td className="p-2 border border-purple-200 text-center">{p.quantity}</td>
                          <td className="p-2 border border-purple-200 text-right">₹{p.unitPrice}</td>
                          <td className="p-2 border border-purple-200 text-right">₹{p.total}</td>
                        </tr>
                      ))}
                      {selectedJobCardForPrint.labourCharges?.map((l, i) => (
                        <tr key={i} className="border border-purple-200">
                          <td className="p-2 border border-purple-200">{l.description} (Labour)</td>
                          <td className="p-2 border border-purple-200 text-center">1</td>
                          <td className="p-2 border border-purple-200 text-right">₹{l.amount}</td>
                          <td className="p-2 border border-purple-200 text-right">₹{l.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-right text-xs">
                    <div className="flex justify-between">
                      <span>Parts Subtotal:</span>
                      <span>₹{selectedJobCardForPrint.sparePartsTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labour Subtotal:</span>
                      <span>₹{selectedJobCardForPrint.labourTotal}</span>
                    </div>
                    {selectedJobCardForPrint.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span>-₹{selectedJobCardForPrint.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>{selectedJobCardForPrint.taxRate > 0 ? `GST (${selectedJobCardForPrint.taxRate}%):` : 'Tax (Without Tax):'}</span>
                      <span>{selectedJobCardForPrint.taxAmount > 0 ? `₹${selectedJobCardForPrint.taxAmount}` : '₹0 (Nil)'}</span>
                    </div>
                    <div className="pt-1 border-t border-purple-300 flex justify-between font-bold text-sm text-purple-950">
                      <span>Total Estimate:</span>
                      <span>₹{selectedJobCardForPrint.totalAmount}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-emerald-700">
                      <span>Advance Received:</span>
                      <span>₹{selectedJobCardForPrint.paidAmount || 0}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-600">
                      <span>Estimated Balance:</span>
                      <span>₹{selectedJobCardForPrint.pendingBalance}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-12 border-t border-slate-200 grid grid-cols-2 text-xs text-center">
                <div>
                  <div className="border-t border-slate-400 w-44 mx-auto pt-1 font-semibold">
                    Customer Signature
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-44 mx-auto pt-1 font-semibold">
                    Authorized Workshop Mechanic
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
