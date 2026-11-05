import React from 'react';
import { ShieldCheck, Moon, Sun, UserCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  allUsers,
  onSwitchUser,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);

  const navItems = [
    { id: 'meetings', label: 'Meetings' },
    { id: 'messaging', label: 'Messaging' },
    { id: 'voice', label: 'Voice & SIP' },
    { id: 'pipelines', label: 'Media Pipelines' },
    { id: 'identity', label: 'Identity' },
    { id: 'intelligence', label: 'ML Insights' },
    { id: 'scalability', label: 'Architecture' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-slate-100 px-6 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
            C
          </div>
          <button
            onClick={() => setActiveTab('meetings')}
            className="text-left font-bold tracking-tight text-white hover:text-blue-400 transition-colors whitespace-nowrap"
          >
            ChimeVault
          </button>
          <span className="hidden lg:inline text-xs font-mono text-slate-400 border-l border-slate-800 pl-3">
            Banking RTC Suite
          </span>
        </div>

        {/* Zone 2: Navigation Links (Clean single-line text links) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap transition-colors py-1 ${
                  isActive
                    ? 'text-white border-b-2 border-blue-500 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Controls (Identity switch, Security Status, Theme) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Security Compliance Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FIPS 140-2 · E2EE</span>
          </div>

          {/* User Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap"
              title="Switch user perspective for CRM testing"
            >
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-[10px]">
                {currentUser.avatarText}
              </div>
              <span className="max-w-[110px] truncate">{currentUser.name.split(',')[0]}</span>
              <span className="text-[10px] font-mono text-slate-400">▼</span>
            </button>

            {showRoleMenu && (
              <div
                className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-2 z-50 text-xs"
                onClick={() => setShowRoleMenu(false)}
              >
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                  Switch Active Persona
                </div>
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => onSwitchUser(u)}
                    className={`w-full text-left p-2 rounded flex items-center gap-2.5 transition-colors ${
                      currentUser.id === u.id
                        ? 'bg-blue-600/20 text-blue-300 font-medium'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                      {u.avatarText}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="truncate font-medium">{u.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{u.title}</div>
                    </div>
                    {currentUser.id === u.id && (
                      <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark / Light Toggle */}
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
      
      {/* Mobile Nav strip */}
      <div className="md:hidden flex items-center gap-3 overflow-x-auto pt-3 border-t border-slate-800 mt-2 pb-1 text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded ${
              activeTab === item.id
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
