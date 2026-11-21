import React, { useState, useEffect, useRef } from 'react';
import { Menu, Plus, Calendar, Bell, Wrench, UserPlus, CreditCard, Phone, Search, X, Bike, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Navbar({ onOpenSidebar, onQuickAction, onLookupPhone }) {
  const { user } = useAuth();
  const [phoneSearch, setPhoneSearch] = useState('');
  const [matchingCustomers, setMatchingCustomers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchRef = useRef(null);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Live Phone Search Lookup
  useEffect(() => {
    const clean = phoneSearch.replace(/\D/g, '');
    if (clean.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const res = await api.get(`/customers?search=${encodeURIComponent(clean)}`);
          if (res.data.success) {
            setMatchingCustomers(res.data.data.slice(0, 5));
            setDropdownOpen(true);
          }
        } catch (e) {
          console.error('Phone lookup failed', e);
        } finally {
          setIsSearching(false);
        }
      }, 200);

      return () => clearTimeout(timer);
    } else {
      setMatchingCustomers([]);
      setDropdownOpen(false);
    }
  }, [phoneSearch]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCustomer = (mobile) => {
    setDropdownOpen(false);
    setShowMobileSearch(false);
    setPhoneSearch('');
    if (onLookupPhone) {
      onLookupPhone(mobile);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (phoneSearch.trim()) {
      handleSelectCustomer(phoneSearch.trim());
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-xs px-3 sm:px-6 py-2.5 sm:py-3 transition-all">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Section: Menu Toggle & Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-purple-900 hover:bg-purple-50 active:scale-95 transition-all"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate">
              {user?.workshopName || 'SpeedyWheels Workshop'}
            </h2>
            <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium">
              <span className="hidden sm:inline">{currentDate}</span>
              <span className="hidden sm:inline text-purple-300">•</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Portal</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Customer Phone Lookup (Visible on md & Desktop) */}
        <div ref={searchRef} className="hidden md:block flex-1 max-w-sm mx-auto relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Phone className="w-4 h-4 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              inputMode="tel"
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              placeholder="Find customer by mobile #..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-purple-200 bg-purple-50/30 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-hidden font-medium transition-all"
            />
            {phoneSearch ? (
              <button
                type="button"
                onClick={() => {
                  setPhoneSearch('');
                  setDropdownOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </form>

          {/* Autocomplete Dropdown */}
          {dropdownOpen && matchingCustomers.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden z-50 divide-y divide-purple-50 max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 bg-purple-50/70 text-[10px] font-bold uppercase tracking-wider text-purple-800 flex justify-between">
                <span>Matching Customers</span>
                <span>Select for 360° Profile</span>
              </div>
              {matchingCustomers.map((c) => (
                <div
                  key={c._id}
                  onClick={() => handleSelectCustomer(c.mobile)}
                  className="p-3 hover:bg-purple-50/50 cursor-pointer transition-colors flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <div className="font-bold text-xs text-slate-800 truncate">{c.name}</div>
                    <div className="text-[11px] text-purple-700 font-mono font-medium flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{c.mobile}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-500 font-mono">
                      {c.bikes?.length > 0 ? `${c.bikes[0]?.brand || 'Bike'} (${c.bikes[0]?.registrationNumber || ''})` : 'No bikes'}
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 hover:underline">
                      View Dossier →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Section: Mobile Search Toggle + Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Mobile Search Button (Phone Icon) */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
            title="Search Customer Phone"
            aria-label="Search Customer Phone"
          >
            {showMobileSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onQuickAction('new-job-card')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-700 active:scale-95 text-white shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Job Card</span>
            <span className="sm:hidden font-bold">New Card</span>
          </button>

          <button
            onClick={() => onQuickAction('new-customer')}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Customer</span>
          </button>

          <button
            onClick={() => onQuickAction('new-payment')}
            className="hidden xl:flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment</span>
          </button>
        </div>
      </div>

      {/* Mobile Expandable Search Bar */}
      {showMobileSearch && (
        <div className="md:hidden mt-2 pt-2 border-t border-purple-100">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Phone className="w-4 h-4 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              inputMode="tel"
              autoFocus
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              placeholder="Enter mobile # (e.g. 9845012345)..."
              className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-purple-200 bg-purple-50/40 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-600 outline-hidden font-mono"
            />
            {phoneSearch && (
              <button
                type="button"
                onClick={() => setPhoneSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Autocomplete for Mobile */}
          {dropdownOpen && matchingCustomers.length > 0 && (
            <div className="mt-1.5 bg-white rounded-xl shadow-lg border border-purple-100 divide-y divide-purple-50 max-h-60 overflow-y-auto">
              {matchingCustomers.map((c) => (
                <div
                  key={c._id}
                  onClick={() => handleSelectCustomer(c.mobile)}
                  className="p-2.5 hover:bg-purple-50 cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{c.name}</div>
                    <div className="text-[11px] text-purple-700 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{c.mobile}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-purple-600">
                    View Dossier →
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
