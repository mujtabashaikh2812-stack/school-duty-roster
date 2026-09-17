import React from 'react';
import { School, Users, Building2, Calendar, Settings, RefreshCw } from 'lucide-react';
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
      {/* Top Academic Ribbon (Mobile Compact) */}
      <div className="bg-[#061524] px-3 sm:px-4 py-1.5 border-b border-slate-800/80 text-[10px] sm:text-xs text-slate-300 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="font-semibold text-slate-200 uppercase tracking-wider truncate">
            {schoolMeta.name}
          </span>
          <span className="text-slate-500 hidden xs:inline">|</span>
          <span className="text-amber-300/90 font-medium hidden xs:inline">{schoolMeta.academicYear}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] sm:text-[11px] text-slate-400 shrink-0 ml-auto">
          <span>Staff: <strong className="text-white">{staffCount}</strong></span>
          <span>Duties: <strong className="text-white">{tasksCount}</strong></span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-18 gap-2 sm:gap-4">
          {/* School Brand Block */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-inner border border-amber-400/30 text-white shrink-0">
              <School className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-institutional text-sm sm:text-lg font-bold tracking-wide text-white leading-tight truncate">
                EduRoster Pro
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 font-sans truncate">
                {schoolMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Quick Shuffle Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onShuffle}
              disabled={isShuffling}
              title="Re-shuffle staff across duty stations fairly"
              className="group relative inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white cursor-pointer disabled:opacity-50 min-h-[38px] sm:min-h-[42px]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-500 ${
                  isShuffling ? 'animate-spin' : 'group-hover:rotate-90'
                }`}
              />
              <span className="hidden sm:inline">Shuffle & Allocate</span>
              <span className="sm:hidden font-medium">Shuffle</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Smooth Touch Horizontal Scroll) */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-700/60 py-1.5 sm:py-2 overflow-x-auto no-scrollbar text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap min-h-[40px] ${
              activeTab === 'roster'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Duty Roster</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap min-h-[40px] ${
              activeTab === 'staff'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Staff Directory ({staffCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap min-h-[40px] ${
              activeTab === 'tasks'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Duty Stations ({tasksCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap min-h-[40px] ${
              activeTab === 'settings'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
