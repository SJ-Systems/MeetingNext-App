import React, { useState } from 'react';
import {
  Video,
  Calendar,
  CalendarPlus,
  Phone,
  Settings,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

import { AuthUser } from '../../types/meetingnext';
import { LogOut } from 'lucide-react';

export type MeetingNextPage = 'home' | 'my_meetings' | 'schedule' | 'telephonic' | 'settings';

interface MeetingNextHeaderProps {
  activePage: MeetingNextPage;
  onNavigate: (page: MeetingNextPage) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const MeetingNextHeader: React.FC<MeetingNextHeaderProps> = ({
  activePage,
  onNavigate,
  currentUser,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems: { id: MeetingNextPage; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: null },
    { id: 'my_meetings', label: 'My Meetings', icon: Calendar },
    { id: 'schedule', label: 'Schedule meeting', icon: CalendarPlus },
    { id: 'telephonic', label: 'Telephonic call', icon: Phone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (page: MeetingNextPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const displayName = currentUser?.name || 'Sarthak Jain, CFA';
  const displayTitle = currentUser?.title || 'Senior Relationship Manager';
  const displayAvatar = currentUser?.avatar || 'SJ';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Only One Logo: MeetingNext */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95 cursor-pointer"
          >
            {/* Futuristic Warm Pink Logo Glyph */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 flex items-center justify-center text-white shadow-sm shadow-pink-200 group-hover:shadow-pink-300 transition-all">
              <Video className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-pink-600 transition-colors">
                MeetingNext
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-rose-50 text-rose-600 shadow-sm shadow-rose-100 border border-rose-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Profile / RM Indicator & Logout */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 pl-3 border-l border-slate-100 text-xs hover:opacity-85 transition-opacity cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-rose-200/70 shadow-xs">
                {displayAvatar}
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 text-xs leading-tight">
                  {displayName}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {displayTitle}
                </div>
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || 'sarthak.jain@businessnext.com'}</p>
                  <p className="text-[10px] text-rose-600 font-medium mt-0.5">Phone: +91 9518833885</p>
                </div>
                {onLogout && (
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-100 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  isActive
                    ? 'bg-rose-50 text-rose-600 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
