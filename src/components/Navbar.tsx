import React from 'react';
import { School, Users, Building2, Calendar, Sparkles, Settings, RefreshCw } from 'lucide-react';
import { SchoolMetadata } from '../types';

interface NavbarProps {
  schoolMeta: SchoolMetadata;
  activeTab: 'roster' | 'staff' | 'tasks' | 'settings';
  setActiveTab: (tab: 'roster' | 'staff' | 'tasks' | 'settings') => void;
  onShuffle: () => void;
  isShuffling: boolean;
  staffCount: number;
  tasksCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  schoolMeta,
  activeTab,
  setActiveTab,
  onShuffle,
  isShuffling,
  staffCount,
  tasksCount,
}) => {
  return (
    <header className="no-print bg-[#0a1e33] border-b border-slate-700 text-white sticky top-0 z-40 shadow-md">
      {/* Top Academic Ribbon */}
      <div className="bg-[#061524] px-4 py-1.5 border-b border-slate-800/80 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
            Institutional Roster Management System
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-300/90 font-medium">{schoolMeta.academicYear}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Active Personnel: <strong className="text-white">{staffCount}</strong></span>
          <span>Duty Stations: <strong className="text-white">{tasksCount}</strong></span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* School Brand Block */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-inner border border-amber-400/30 text-white">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-institutional text-base sm:text-lg font-bold tracking-wide text-white leading-tight">
                {schoolMeta.name}
              </h1>
              <p className="text-xs text-slate-400 font-sans">{schoolMeta.subtitle}</p>
            </div>
          </div>

          {/* Quick Shuffle Action Button */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onShuffle}
              disabled={isShuffling}
              title="Re-shuffle staff across duty stations fairly"
              className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${isShuffling ? 'animate-spin' : 'group-hover:rotate-90'}`} />
              <span className="hidden sm:inline">Shuffle & Allocate Staff</span>
              <span className="sm:hidden">Shuffle</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-700/60 pt-2 pb-2.5 overflow-x-auto text-sm font-medium">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Duty Roster Table</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Directory ({staffCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Duty Stations & Tasks ({tasksCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Institution Settings</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
