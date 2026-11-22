import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/super-admin/login');
  };

  const navItems = [
    { name: 'Platform Dashboard', path: '/super-admin/dashboard', icon: '📊' },
    { name: 'Workshop Management', path: '/super-admin/workshops', icon: '🏢' },
    { name: 'Active Users & Sessions', path: '/super-admin/users', icon: '👥' },
    { name: 'Live Chat Support', path: '/super-admin/chat', icon: '💬' },
    { name: 'Platform Reports', path: '/super-admin/reports', icon: '📈' },
    { name: 'Company Branding', path: '/super-admin/branding', icon: '🎨' },
    { name: 'System Settings', path: '/super-admin/settings', icon: '⚙️' },
    { name: 'Activity Audit Logs', path: '/super-admin/logs', icon: '📜' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-slate-900 border-r border-slate-800 p-5 select-none shrink-0">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 pb-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/30">
            🛡️
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight leading-tight">
              SpeedyWheels SaaS
            </h1>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-indigo-400 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-800/50">
              Super Admin Console
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Super Admin User Footer */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Super Admin'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@platform'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Logout from Super Admin Console"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm shadow">
            🛡️
          </div>
          <div>
            <h1 className="font-bold text-sm text-white">Super Admin</h1>
            <p className="text-[10px] text-slate-400">SpeedyWheels SaaS</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-1.5 animate-in slide-in-from-top duration-200">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/40"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* Main Dynamic Workspace Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950 flex flex-col justify-between">
        <div className="max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>

        {/* Super Admin Platform Footer */}
        <footer className="mt-12 pt-4 pb-2 border-t border-slate-800/80 text-center text-xs text-slate-500">
          <span>SpeedyWheels SaaS Platform Governance • </span>
          <span className="font-semibold text-indigo-400">Powered by RB Nextwave</span>
        </footer>
      </main>
    </div>
  );
}

