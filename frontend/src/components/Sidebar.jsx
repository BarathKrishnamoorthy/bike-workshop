import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
  CreditCard,
  BarChart3,
  LogOut,
  Bike,
  ShieldCheck,
  Settings,
  Building2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'customers', label: 'Customers & Bikes', icon: Users, path: '/customers' },
  { id: 'services', label: 'Service Management', icon: Wrench, path: '/services' },
  { id: 'payments', label: 'Payment & Invoicing', icon: CreditCard, path: '/payments' },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, path: '/reports' },
];

export default function Sidebar({ currentTab, setCurrentTab, isOpen, setIsOpen, onOpenSettings }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, workshop, logout } = useAuth();

  const tenantId = workshop?.workshop_id || user?.workshop_id || 'WS-1001';
  const workshopName = workshop?.workshop_name || user?.workshopName || 'SpeedyWheels';

  const isItemActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-[#4c1d95] via-[#581c87] to-[#3b0764] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-purple-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-200 shadow-inner shrink-0">
              <Bike className="w-6 h-6 text-purple-200" />
            </div>
            <div className="truncate">
              <h1 className="text-base font-bold tracking-tight text-white truncate flex items-center gap-1.5">
                {workshopName}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-900/80 text-purple-200 border border-purple-700/60">
                  {tenantId}
                </span>
                <span className="text-[10px] text-purple-200/60 font-medium">SaaS Portal</span>
              </div>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-purple-300 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-5 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-purple-300/60 flex justify-between items-center">
            <span>Main Menu</span>
            <span className="text-[10px] text-purple-300/40 font-mono">Isolated Data</span>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.path) || currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  if (setCurrentTab) setCurrentTab(item.id);
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
                    isActive ? 'text-white' : 'text-purple-300/80 group-hover:text-white'
                  }`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-5 rounded-full bg-white" />
                )}
              </button>
            );
          })}

          {/* Workshop Settings Item */}
          <div className="pt-4 border-t border-purple-800/40 mt-4">
            <button
              onClick={() => {
                if (onOpenSettings) onOpenSettings();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-xl text-xs font-medium text-purple-200 hover:bg-purple-800/40 hover:text-white transition-all text-left"
            >
              <Settings className="w-4 h-4 text-purple-400" />
              <span>Workshop Settings</span>
            </button>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-purple-800/60 bg-purple-950/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin User'}</p>
                <div className="flex items-center gap-1 text-[11px] text-purple-300/80">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="capitalize">{user?.role || 'Owner'}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-semibold text-purple-200 hover:text-white bg-purple-900/60 hover:bg-rose-900/50 rounded-lg transition-colors border border-purple-700/40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
