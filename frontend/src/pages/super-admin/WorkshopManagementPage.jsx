import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function WorkshopManagementPage() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [workshopDetails, setWorkshopDetails] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchWorkshops();
  }, [statusFilter]);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (searchQuery) params.q = searchQuery;

      const res = await api.get('/super-admin/workshops', { params });
      if (res.data?.success) {
        setWorkshops(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load workshops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWorkshops();
  };

  const handleToggleStatus = async (ws) => {
    const nextStatus = ws.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to ${nextStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE'} ${ws.workshop_name}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoadingId(ws._id);
      const res = await api.put(`/super-admin/workshops/${ws._id}/status`, {
        status: nextStatus,
      });
      if (res.data?.success) {
        setWorkshops((prev) =>
          prev.map((w) => (w._id === ws._id ? { ...w, status: nextStatus } : w))
        );
      }
    } catch (err) {
      console.error('Failed to update workshop status:', err);
      alert('Could not update workshop status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewDetails = async (ws) => {
    setSelectedWorkshop(ws);
    try {
      setDetailsLoading(true);
      const res = await api.get(`/super-admin/workshops/${ws._id}`);
      if (res.data?.success) {
        setWorkshopDetails(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load workshop details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Workshop Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor, authorize, and govern all multi-tenant bike repair workshops on the platform.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl font-medium">
            Total Workshops: <strong className="text-white">{workshops.length}</strong>
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="w-full md:w-96 flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by workshop name, owner, city, ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-3.5 top-3 text-slate-500">🔍</span>
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition"
          >
            Search
          </button>
        </form>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {['All', 'active', 'suspended'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {status === 'All' ? 'All Workshops' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Workshop Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-4 px-5">Workshop Details</th>
                <th className="py-4 px-5">Tenant ID</th>
                <th className="py-4 px-5">Owner / Contact</th>
                <th className="py-4 px-5 text-center">Customers</th>
                <th className="py-4 px-5 text-center">Job Cards</th>
                <th className="py-4 px-5 text-right">Revenue</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading workshops...
                  </td>
                </tr>
              ) : workshops.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-500">
                    No workshops match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                workshops.map((ws) => (
                  <tr key={ws._id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-white">{ws.workshop_name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{ws.location}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-mono text-xs bg-slate-950 border border-slate-800 px-2 py-1 rounded text-indigo-400">
                        {ws.workshop_id}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-xs">
                      <div className="font-medium text-slate-200">{ws.owner_name}</div>
                      <div className="text-slate-400">{ws.owner_email}</div>
                      <div className="text-slate-500 mt-0.5">{ws.phone_number}</div>
                    </td>
                    <td className="py-4 px-5 text-center font-semibold text-white">
                      {ws.customer_count ?? 0}
                    </td>
                    <td className="py-4 px-5 text-center font-semibold text-white">
                      {ws.service_count ?? 0}
                    </td>
                    <td className="py-4 px-5 text-right font-semibold text-emerald-400">
                      ₹{(ws.revenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          ws.status === 'active'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                            : 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            ws.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        ></span>
                        {ws.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(ws)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleToggleStatus(ws)}
                          disabled={actionLoadingId === ws._id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            ws.status === 'active'
                              ? 'bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60'
                              : 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60'
                          }`}
                        >
                          {actionLoadingId === ws._id
                            ? '...'
                            : ws.status === 'active'
                            ? 'Suspend'
                            : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workshop Details Modal */}
      {selectedWorkshop && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex min-h-full items-start sm:items-center justify-center p-2 sm:p-5 pt-3 sm:pt-5 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] overflow-y-auto shadow-2xl p-4 sm:p-6 my-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedWorkshop.workshop_name}
                </h3>
                <p className="text-xs text-indigo-400 font-mono mt-0.5">
                  Tenant ID: {selectedWorkshop.workshop_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedWorkshop(null)}
                className="text-slate-400 hover:text-white p-1 text-lg"
              >
                ✕
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Retrieving tenant profile...
              </div>
            ) : (
              <div className="space-y-6 mt-4">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Location</span>
                    <span className="text-slate-200 font-medium">{selectedWorkshop.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone</span>
                    <span className="text-slate-200 font-medium">{selectedWorkshop.phone_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Account Status</span>
                    <span className={`font-semibold ${selectedWorkshop.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedWorkshop.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Registered On</span>
                    <span className="text-slate-200 font-medium">
                      {new Date(selectedWorkshop.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Users assigned to this workshop */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Authorized Staff & Mechanics ({workshopDetails?.users?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {workshopDetails?.users?.map((u) => (
                      <div
                        key={u._id}
                        className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-slate-400">{u.email} • {u.phone || u.phone_number}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 font-medium border border-indigo-800/50 uppercase text-[10px]">
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent job cards */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Recent Job Cards ({workshopDetails?.recentServices?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {workshopDetails?.recentServices?.slice(0, 5).map((srv) => (
                      <div
                        key={srv._id}
                        className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">{srv.jobCardNumber} - {srv.serviceType}</p>
                          <p className="text-slate-400">Total: ₹{srv.totalAmount} • Status: {srv.status}</p>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(srv.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedWorkshop(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

