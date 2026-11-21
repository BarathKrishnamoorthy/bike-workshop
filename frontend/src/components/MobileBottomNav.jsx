import React from 'react';
import {
  LayoutDashboard,
  Users,
  Wrench,
  CreditCard,
  BarChart3,
  Plus
} from 'lucide-react';

export default function MobileBottomNav({ currentTab, setCurrentTab, onOpenNewJobCard }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-purple-100 shadow-[0_-4px_20px_rgba(124,58,237,0.08)] px-2 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-purple-700 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg transition-transform ${isActive ? 'bg-purple-100 scale-105' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* Central Floating "+ Job Card" Action Button */}
        <div className="flex flex-col items-center justify-center px-1 -mt-5">
          <button
            onClick={onOpenNewJobCard}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform border-2 border-white"
            title="Create New Job Card"
            aria-label="Create New Job Card"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-bold text-purple-900 mt-0.5">New Card</span>
        </div>

        {tabs.slice(2).map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-purple-700 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg transition-transform ${isActive ? 'bg-purple-100 scale-105' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
