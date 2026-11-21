import React from 'react';
import { Bike, ShieldCheck, Sparkles, Heart, Activity } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-purple-100 bg-white/80 backdrop-blur-md text-slate-600 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Branding & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
                <Bike className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-800 text-sm tracking-tight">
                SpeedyWheels
              </span>
              <span className="hidden sm:inline text-xs text-purple-300">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Bike Workshop Management Portal
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              © {currentYear} All rights reserved.
            </div>
          </div>

          {/* Right: Powered by RB NextWave */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs">
            {/* System Status Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>

            {/* Official Powered By Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-50 via-purple-100/80 to-indigo-50 border border-purple-200/80 shadow-xs hover:shadow-sm transition-all group">
              <span className="text-[11px] font-medium text-slate-500">
                Powered by
              </span>
              <div className="flex items-center gap-1 font-bold text-xs text-purple-900 group-hover:text-purple-700 transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                <span className="tracking-wide bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 bg-clip-text text-transparent font-extrabold">
                  RB NextWave
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
