import React, { useState } from 'react';
import {
  ShieldCheck,
  Moon,
  Sun,
  UserCheck,
  Building2,
  PhoneCall,
  Video,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { RelationshipManager } from '../../types/crm';

interface CrmHeaderProps {
  activeModule: 'communication' | 'customers' | 'dashboard';
  setActiveModule: (mod: 'communication' | 'customers' | 'dashboard') => void;
  currentRM: RelationshipManager;
  allRMs: RelationshipManager[];
  onSwitchRM: (rm: RelationshipManager) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onQuickVideoCall: () => void;
  onQuickAudioCall: () => void;
}

export const CrmHeader: React.FC<CrmHeaderProps> = ({
  activeModule,
  setActiveModule,
  currentRM,
  allRMs,
  onSwitchRM,
  isDarkMode,
  onToggleDarkMode,
  onQuickVideoCall,
  onQuickAudioCall,
}) => {
  const [showRmDropdown, setShowRmDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-slate-100 px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white shadow-sm text-sm">
            C
          </div>
          <button
            onClick={() => setActiveModule('communication')}
            className="text-left font-bold tracking-tight text-white hover:text-blue-400 transition-colors whitespace-nowrap text-base"
          >
            CRMNEXT
          </button>
          <span className="hidden lg:inline text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
            Apex Enterprise Banking
          </span>
        </div>

        {/* Zone 2: Navigation Links (Clean single-line text links) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => setActiveModule('communication')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeModule === 'communication'
                ? 'text-white border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Communication Hub
          </button>
          <button
            onClick={() => setActiveModule('customers')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeModule === 'customers'
                ? 'text-white border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Customer Directory (360)
          </button>
          <button
            onClick={() => setActiveModule('dashboard')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeModule === 'dashboard'
                ? 'text-white border-b-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Branch Executive KPI
          </button>
        </nav>

        {/* Zone 3: Primary Action & Controls (RM Persona Switcher, Quick Meet, Security, Theme) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Action Meeting Buttons */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={onQuickVideoCall}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors whitespace-nowrap"
              title="Instant Video Meeting"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Instant Video</span>
            </button>
            <button
              onClick={onQuickAudioCall}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700 rounded transition-colors whitespace-nowrap"
              title="Call Customer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call</span>
            </button>
          </div>

          {/* Security Compliance Badge */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FIPS 140-2 · E2EE</span>
          </div>

          {/* RM Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRmDropdown(!showRmDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap"
              title="Switch Relationship Manager view"
            >
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                {currentRM.avatar}
              </div>
              <span className="max-w-[110px] truncate">{currentRM.name.split(',')[0]}</span>
              <span className="text-[10px] font-mono text-slate-400">▼</span>
            </button>

            {showRmDropdown && (
              <div
                className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-2 z-50 text-xs"
                onClick={() => setShowRmDropdown(false)}
              >
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                  Active Relationship Manager
                </div>
                {allRMs.map((rm) => (
                  <button
                    key={rm.id}
                    onClick={() => onSwitchRM(rm)}
                    className={`w-full text-left p-2 rounded flex items-center gap-2.5 transition-colors ${
                      currentRM.id === rm.id
                        ? 'bg-blue-600/20 text-blue-300 font-medium'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                      {rm.avatar}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="truncate font-medium">{rm.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{rm.title}</div>
                    </div>
                    {currentRM.id === rm.id && (
                      <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav row */}
      <div className="md:hidden flex items-center gap-4 overflow-x-auto pt-2.5 border-t border-slate-800 mt-2 text-xs">
        <button
          onClick={() => setActiveModule('communication')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${
            activeModule === 'communication'
              ? 'bg-blue-600 text-white font-medium'
              : 'text-slate-400'
          }`}
        >
          Communication Hub
        </button>
        <button
          onClick={() => setActiveModule('customers')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${
            activeModule === 'customers'
              ? 'bg-blue-600 text-white font-medium'
              : 'text-slate-400'
          }`}
        >
          Customer Directory
        </button>
        <button
          onClick={() => setActiveModule('dashboard')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${
            activeModule === 'dashboard'
              ? 'bg-blue-600 text-white font-medium'
              : 'text-slate-400'
          }`}
        >
          Executive KPI
        </button>
      </div>
    </header>
  );
};
