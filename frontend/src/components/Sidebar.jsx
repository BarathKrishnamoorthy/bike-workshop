import React from 'react';
import {
  LayoutDashboard,
  Users,
  Wrench,
  CreditCard,
  BarChart3,
  LogOut,
  Bike,
  ShieldCheck,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'customers', label: 'Customers & Bikes', icon: Users, path: '/customers' },
  { id: 'services', label: 'Service Management', icon: Wrench, path: '/services' },
  { id: 'payments', label: 'Payment & Invoicing', icon: CreditCard, path: '/payments' },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, path: '/reports' },
];

export default function Sidebar({ currentTab, setCurrentTab, isOpen, setIsOpen }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop with Blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-[#4c1d95] via-[#581c87] to-[#3b0764] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 sm:p-6 border-b border-purple-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-200 shadow-inner">
              <Bike className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                SpeedyWheels
              </h1>
              <p className="text-xs text-purple-200/70 font-medium">Workshop Portal</p>
            </div>
          </div>
          {/* Close button for mobile & tablet */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-purple-300 hover:text-white p-2 rounded-xl hover:bg-purple-800/50 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-5 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-purple-300/60">
            Main Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 ring-1 ring-purple-400/40'
                    : 'text-purple-100/80 hover:bg-purple-800/50 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : 'text-purple-300/80'
                  }`}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-5 rounded-full bg-white shadow-sm" />
                )}
              </button>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-purple-800/60 bg-purple-950/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin User'}</p>
                <div className="flex items-center gap-1 text-[11px] text-purple-300/80">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="capitalize">{user?.role || 'Administrator'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-purple-300 hover:text-rose-300 hover:bg-purple-900/60 rounded-lg transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Powered by RB NextWave (Sidebar Badge) */}
          <div className="pt-2 border-t border-purple-800/40 flex items-center justify-center gap-1.5 text-[11px] text-purple-300/70 font-medium">
            <span>Powered by</span>
            <span className="font-bold text-white flex items-center gap-1 tracking-wide">
              <Sparkles className="w-3 h-3 text-purple-400" />
              RB NextWave
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
