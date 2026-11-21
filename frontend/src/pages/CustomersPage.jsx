import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Bike,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wrench,
  Clock,
  Trash2,
  Edit2,
  Eye,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import api from '../services/api';

export default function CustomersPage({ onBookServiceForBike, onLookupPhone }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddBikeModal, setShowAddBikeModal] = useState(false);
  const [activeCustomerIdForBike, setActiveCustomerIdForBike] = useState(null);

  // Duplicate customer detection state
  const [existingCustomerFound, setExistingCustomerFound] = useState(null);
  const [checkingMobile, setCheckingMobile] = useState(false);

  // New Customer Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    notes: '',
    initialBike: {
      brand: 'Royal Enfield',
      model: '',
      registrationNumber: '',
      currentKilometre: '',
      year: new Date().getFullYear(),
      fuelType: 'Petrol',
      color: '',
    },
  });

  // Additional Bike Form State
  const [bikeFormData, setBikeFormData] = useState({
    brand: 'Honda',
    model: '',
    registrationNumber: '',
    currentKilometre: '',
    year: new Date().getFullYear(),
    fuelType: 'Petrol',
    color: '',
  });

  const fetchCustomers = async (searchQuery = '') => {
    try {
      setLoading(true);
      const url = searchQuery ? `/customers?search=${encodeURIComponent(searchQuery)}` : '/customers';
      const res = await api.get(url);
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  // Handle Mobile input with instant duplicate detection
  const handleMobileInput = async (val) => {
    setFormData((prev) => ({ ...prev, mobile: val }));
    const clean = val.replace(/\D/g, '');
    if (clean.length >= 10) {
      try {
        setCheckingMobile(true);
        const res = await api.get(`/customers/lookup/${clean}`);
        if (res.data.success && res.data.data?.customer) {
          setExistingCustomerFound(res.data.data);
        } else {
          setExistingCustomerFound(null);
        }
      } catch (err) {
        setExistingCustomerFound(null);
      } finally {
        setCheckingMobile(false);
      }
    } else {
      setExistingCustomerFound(null);
    }
  };

  const handleOpenDetails = async (customerId) => {
    try {
      setDetailsLoading(true);
      const res = await api.get(`/customers/${customerId}`);
      if (res.data.success) {
        setSelectedCustomer(res.data.data);
      }
    } catch (err) {
      console.error('Error loading customer details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      alert('Please fill customer Name and Mobile number');
      return;
    }

    if (existingCustomerFound) {
      alert('A customer with this mobile number already exists. Please use the existing profile.');
      return;
    }

    try {
      const res = await api.post('/customers', formData);
      if (res.data.success) {
        setShowAddModal(false);
        setFormData({
          name: '',
          mobile: '',
          email: '',
          address: '',
          notes: '',
          initialBike: {
            brand: 'Royal Enfield',
            model: '',
            registrationNumber: '',
            currentKilometre: '',
            year: new Date().getFullYear(),
            fuelType: 'Petrol',
            color: '',
          },
        });
        setExistingCustomerFound(null);
        fetchCustomers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register customer');
    }
  };

  const handleAddBike = async (e) => {
    e.preventDefault();
    if (!bikeFormData.brand || !bikeFormData.model || !bikeFormData.registrationNumber) {
      alert('Please provide Brand, Model, and Registration Number');
      return;
    }

    try {
      const res = await api.post('/bikes', {
        ...bikeFormData,
        customerId: activeCustomerIdForBike,
      });

      if (res.data.success) {
        setShowAddBikeModal(false);
        setBikeFormData({
          brand: 'Honda',
          model: '',
          registrationNumber: '',
          currentKilometre: '',
          year: new Date().getFullYear(),
          fuelType: 'Petrol',
          color: '',
        });
        fetchCustomers();
        if (selectedCustomer && selectedCustomer._id === activeCustomerIdForBike) {
          handleOpenDetails(activeCustomerIdForBike);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add bike');
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove customer "${name}" and all associated bike records?`)) {
      return;
    }
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
      if (selectedCustomer && selectedCustomer._id === id) {
        setSelectedCustomer(null);
      }
    } catch (err) {
      alert('Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Customer & Bike Registry</h1>
          <p className="text-slate-500 text-sm">Unique mobile number customer identification, multi-bike profiles and service history</p>
        </div>
        <button
          onClick={() => {
            setExistingCustomerFound(null);
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Customer</span>
        </button>
      </div>

      {/* Search Input with Phone Identification Priority */}
      <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-card flex items-center gap-3">
        <Phone className="w-5 h-5 text-purple-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter customers by mobile number (e.g. 9845012345), customer name, or bike registration..."
          className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Customers Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-purple-100 shadow-card overflow-hidden">
        {/* Mobile Cards View (Phones < md) */}
        <div className="md:hidden divide-y divide-purple-50">
          {loading ? (
            <div className="py-12 text-center text-purple-600 text-xs">
              <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Loading customer directory...
            </div>
          ) : customers.length > 0 ? (
            customers.map((c) => (
              <div key={c._id} className="p-4 space-y-3 hover:bg-purple-50/20 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{c.name}</h3>
                    <div className="text-[11px] text-slate-400">Joined: {new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button
                    onClick={() => onLookupPhone && onLookupPhone(c.mobile)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-xs flex items-center gap-1 active:scale-95"
                  >
                    <span>360° Dossier</span>
                  </button>
                </div>

                {/* Contact info */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <a
                    href={`tel:${c.mobile}`}
                    className="inline-flex items-center gap-1 font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{c.mobile}</span>
                  </a>
                  {c.email && (
                    <span className="text-slate-500 truncate max-w-[180px]">{c.email}</span>
                  )}
                </div>

                {/* Registered Bikes */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Bikes ({c.bikes?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.bikes && c.bikes.length > 0 ? (
                      c.bikes.map((b) => (
                        <span
                          key={b._id || b}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50/80 text-purple-700 border border-purple-200/80 font-mono"
                        >
                          <Bike className="w-3 h-3 text-purple-600" />
                          <span>{b.brand ? `${b.brand} (${b.registrationNumber})` : 'Bike'}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No bikes registered</span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-purple-50 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 truncate max-w-[140px]">{c.address || 'No address'}</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        setActiveCustomerIdForBike(c._id);
                        setShowAddBikeModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100"
                    >
                      + Bike
                    </button>
                    <button
                      onClick={() => handleOpenDetails(c._id)}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-purple-50"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(c._id, c.name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No customers found matching "{search}".
            </div>
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fcfaff] text-xs font-semibold text-purple-950 uppercase border-b border-purple-100">
              <tr>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-4">Mobile & Contact</th>
                <th className="py-3.5 px-4">Registered Bikes</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-purple-600">
                    <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Joined: {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => onLookupPhone && onLookupPhone(c.mobile)}
                        className="flex items-center space-x-1.5 font-bold text-purple-700 hover:text-purple-900 font-mono text-sm underline decoration-purple-300"
                        title="Click to open 360° Profile & Service History"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{c.mobile}</span>
                      </button>
                      {c.email && (
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {c.bikes && c.bikes.length > 0 ? (
                          c.bikes.map((b) => (
                            <span
                              key={b._id || b}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/80 font-mono"
                            >
                              <Bike className="w-3 h-3 text-purple-600" />
                              {b.brand ? `${b.brand} (${b.registrationNumber})` : 'Registered Bike'}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No bikes registered</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-xs text-slate-600 max-w-[200px] truncate" title={c.address}>
                        {c.address || 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onLookupPhone && onLookupPhone(c.mobile)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-2xs"
                          title="Open Customer 360° Dossier & Service Record"
                        >
                          360° Dossier
                        </button>
                        <button
                          onClick={() => {
                            setActiveCustomerIdForBike(c._id);
                            setShowAddBikeModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                          title="Add another bike to this customer"
                        >
                          + Bike
                        </button>
                        <button
                          onClick={() => handleOpenDetails(c._id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                          title="View customer profile drawer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c._id, c.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    No customers found matching "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-purple-100 overflow-hidden">
            <div className="p-5 border-b border-purple-100 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{selectedCustomer.name}</h3>
                <p className="text-xs text-purple-200">Customer Profile & Complete Workshop History</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-purple-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Mobile Number</span>
                  <span className="font-semibold text-slate-800 font-mono">{selectedCustomer.mobile}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Email Address</span>
                  <span className="text-slate-800">{selectedCustomer.email || 'None'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Residence Address</span>
                  <span className="text-slate-800">{selectedCustomer.address || 'None'}</span>
                </div>
              </div>

              {/* Registered Bikes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Bike className="w-4 h-4 text-purple-600" />
                    <span>Registered Bikes ({selectedCustomer.bikes?.length || 0})</span>
                  </h4>
                  <button
                    onClick={() => {
                      setActiveCustomerIdForBike(selectedCustomer._id);
                      setShowAddBikeModal(true);
                    }}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Another Bike</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCustomer.bikes?.map((b) => (
                    <div
                      key={b._id}
                      className="p-3.5 rounded-xl border border-purple-100 bg-white shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-sm">{b.brand} {b.model}</span>
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full font-mono">
                            {b.registrationNumber}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-2 space-y-1">
                          <div>Current KM: <strong className="text-slate-700">{b.currentKilometre} KM</strong></div>
                          <div>Year / Fuel: {b.year || 'N/A'} • {b.fuelType || 'Petrol'}</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-purple-50 flex justify-end">
                        <button
                          onClick={() => {
                            if (onBookServiceForBike) {
                              onBookServiceForBike(selectedCustomer._id, b._id);
                              setSelectedCustomer(null);
                            }
                          }}
                          className="text-xs font-semibold text-purple-600 hover:text-purple-800"
                        >
                          + Create Job Card →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service History Timeline */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-purple-600" />
                  <span>Service & Job Card History ({selectedCustomer.serviceHistory?.length || 0})</span>
                </h4>

                <div className="space-y-3">
                  {selectedCustomer.serviceHistory && selectedCustomer.serviceHistory.length > 0 ? (
                    selectedCustomer.serviceHistory.map((s) => (
                      <div
                        key={s._id}
                        className="p-4 rounded-xl border border-purple-100 bg-[#faf8ff] hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-purple-700 font-mono text-sm">{s.jobCardNumber}</span>
                            <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              {s.serviceType}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(s.serviceDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            Bike: <strong className="text-slate-800">{s.bike?.brand} {s.bike?.model} ({s.bike?.registrationNumber})</strong>
                          </p>
                          {s.workPerformed && (
                            <p className="text-xs text-slate-500 mt-1 italic line-clamp-1">
                              Work: {s.workPerformed}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-slate-800 text-sm">₹{s.totalAmount?.toLocaleString('en-IN')}</div>
                          <span className={`inline-block text-[11px] font-semibold mt-0.5 px-2 py-0.5 rounded-full ${
                            s.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {s.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No past service visits recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal with Phone Duplicate Prevention */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-purple-100 overflow-hidden">
            <div className="p-5 border-b border-purple-100 bg-purple-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">Register Customer & Bike</h3>
              <button onClick={() => setShowAddModal(false)} className="text-purple-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Mobile Number * (Unique Key)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => handleMobileInput(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden font-mono"
                    />
                  </div>
                  {checkingMobile && (
                    <span className="text-[10px] text-purple-600 mt-1 block">Checking mobile uniqueness...</span>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Verma"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden"
                  />
                </div>
              </div>

              {/* Duplicate Alert Card */}
              {existingCustomerFound && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Customer Already Registered with this Mobile!</span>
                  </div>
                  <p>
                    Found existing account for <strong>{existingCustomerFound.customer.name}</strong> with{' '}
                    <strong>{existingCustomerFound.bikes.length} registered bikes</strong>. System prevents duplicate records for the same mobile.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        handleOpenDetails(existingCustomerFound.customer._id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700"
                    >
                      Open Existing Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setActiveCustomerIdForBike(existingCustomerFound.customer._id);
                        setShowAddBikeModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100"
                    >
                      + Add Bike to This Customer
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul@example.com"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Address / Area</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. #12, 5th Block, Koramangala"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden"
                  />
                </div>
              </div>

              {/* Primary Bike Details Section */}
              <div className="pt-3 border-t border-purple-100">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 block mb-3">
                  Primary Bike Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Brand</label>
                    <select
                      value={formData.initialBike.brand}
                      onChange={(e) => setFormData({
                        ...formData,
                        initialBike: { ...formData.initialBike, brand: e.target.value }
                      })}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden bg-white"
                    >
                      <option value="Royal Enfield">Royal Enfield</option>
                      <option value="Honda">Honda</option>
                      <option value="Yamaha">Yamaha</option>
                      <option value="Bajaj">Bajaj</option>
                      <option value="TVS">TVS</option>
                      <option value="KTM">KTM</option>
                      <option value="Suzuki">Suzuki</option>
                      <option value="Hero">Hero</option>
                      <option value="Ather">Ather</option>
                      <option value="Ola Electric">Ola Electric</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Model Name</label>
                    <input
                      type="text"
                      value={formData.initialBike.model}
                      onChange={(e) => setFormData({
                        ...formData,
                        initialBike: { ...formData.initialBike, model: e.target.value }
                      })}
                      placeholder="e.g. Classic 350"
                      className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Registration #</label>
                    <input
                      type="text"
                      value={formData.initialBike.registrationNumber}
                      onChange={(e) => setFormData({
                        ...formData,
                        initialBike: { ...formData.initialBike, registrationNumber: e.target.value.toUpperCase() }
                      })}
                      placeholder="KA 03 MX 1234"
                      className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Current Kilometres</label>
                    <input
                      type="number"
                      value={formData.initialBike.currentKilometre}
                      onChange={(e) => setFormData({
                        ...formData,
                        initialBike: { ...formData.initialBike, currentKilometre: e.target.value }
                      })}
                      placeholder="e.g. 15000"
                      className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Fuel Type</label>
                    <select
                      value={formData.initialBike.fuelType}
                      onChange={(e) => setFormData({
                        ...formData,
                        initialBike: { ...formData.initialBike, fuelType: e.target.value }
                      })}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 outline-hidden bg-white"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Electric">Electric</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Vehicle Color</label>
                    <input
                      type="text"
                      value={formData.initialBike.color}
                      onChange={(e) => setFormData({
                        ...formData,
                        initialBike: { ...formData.initialBike, color: e.target.value }
                      })}
                      placeholder="e.g. Stealth Black"
                      className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-purple-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!existingCustomerFound}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white shadow-sm shadow-purple-200"
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Additional Bike Modal */}
      {showAddBikeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-purple-100 overflow-hidden">
            <div className="p-4 border-b border-purple-100 bg-purple-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Register Additional Bike</h3>
              <button onClick={() => setShowAddBikeModal(false)} className="text-purple-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBike} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Brand *</label>
                <select
                  value={bikeFormData.brand}
                  onChange={(e) => setBikeFormData({ ...bikeFormData, brand: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden bg-white"
                >
                  <option value="Royal Enfield">Royal Enfield</option>
                  <option value="Honda">Honda</option>
                  <option value="Yamaha">Yamaha</option>
                  <option value="Bajaj">Bajaj</option>
                  <option value="TVS">TVS</option>
                  <option value="KTM">KTM</option>
                  <option value="Suzuki">Suzuki</option>
                  <option value="Hero">Hero</option>
                  <option value="Ather">Ather</option>
                  <option value="Ola Electric">Ola Electric</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Model Name *</label>
                <input
                  type="text"
                  required
                  value={bikeFormData.model}
                  onChange={(e) => setBikeFormData({ ...bikeFormData, model: e.target.value })}
                  placeholder="e.g. Activa 6G"
                  className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Registration Number *</label>
                <input
                  type="text"
                  required
                  value={bikeFormData.registrationNumber}
                  onChange={(e) => setBikeFormData({ ...bikeFormData, registrationNumber: e.target.value.toUpperCase() })}
                  placeholder="KA 04 AB 9988"
                  className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 focus:border-purple-600 outline-hidden font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Current KM</label>
                  <input
                    type="number"
                    value={bikeFormData.currentKilometre}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, currentKilometre: e.target.value })}
                    placeholder="12000"
                    className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Color</label>
                  <input
                    type="text"
                    value={bikeFormData.color}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, color: e.target.value })}
                    placeholder="Blue"
                    className="w-full text-sm px-3 py-2 rounded-xl border border-purple-200 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-purple-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddBikeModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs"
                >
                  Add Bike
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
