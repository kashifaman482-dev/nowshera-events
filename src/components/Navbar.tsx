import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Ticket,
  LayoutDashboard,
  CalendarCog,
  Users,
  LogIn,
  LogOut,
  Shield,
  Menu,
  X,
  MapPin,
  Check,
} from 'lucide-react';
import { UserRole } from '../types';

export type ActiveTab = 'events' | 'my-registrations' | 'admin-dashboard' | 'admin-events' | 'admin-attendees';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user, role, isAdmin, signOut, setSimulatedRole, simulatedRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTabClick('events')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  Nowshera Events
                </span>
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  Khyber Pakhtunkhwa
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-tab-events"
              onClick={() => handleTabClick('events')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'events'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Upcoming Events
            </button>

            <button
              id="nav-tab-my-registrations"
              onClick={() => handleTabClick('my-registrations')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'my-registrations'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Ticket className="w-4 h-4" />
              My Registrations
            </button>

            {/* Admin Section Tabs */}
            {isAdmin && (
              <div className="flex items-center pl-2 ml-2 border-l border-slate-200 gap-1">
                <button
                  id="nav-tab-admin-dashboard"
                  onClick={() => handleTabClick('admin-dashboard')}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'admin-dashboard'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>

                <button
                  id="nav-tab-admin-events"
                  onClick={() => handleTabClick('admin-events')}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'admin-events'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70'
                  }`}
                >
                  <CalendarCog className="w-4 h-4" />
                  Event Management
                </button>

                <button
                  id="nav-tab-admin-attendees"
                  onClick={() => handleTabClick('admin-attendees')}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'admin-attendees'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100/70'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Attendee List
                </button>
              </div>
            )}
          </nav>

          {/* User & Role Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Role Switcher Pill */}
            <div className="relative">
              <button
                id="role-badge-button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  role === 'admin'
                    ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Click to toggle or switch role"
              >
                <Shield className="w-3.5 h-3.5 text-current" />
                <span className="capitalize">{role}</span>
                {simulatedRole && <span className="text-[10px] opacity-75">(Simulated)</span>}
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Role View Switcher
                  </div>
                  <button
                    onClick={() => {
                      setSimulatedRole('attendee');
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Attendee View</span>
                    {role === 'attendee' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => {
                      setSimulatedRole('admin');
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Admin View</span>
                    {role === 'admin' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                  {simulatedRole && (
                    <button
                      onClick={() => {
                        setSimulatedRole(null);
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full px-3 py-1.5 mt-1 border-t border-slate-100 text-left text-[11px] text-slate-500 hover:text-slate-700"
                    >
                      Reset to Profile Default
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Auth status */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="text-xs text-slate-600 font-medium max-w-[130px] truncate" title={user.email || ''}>
                  {user.email}
                </span>
                <button
                  id="navbar-signout-btn"
                  onClick={() => signOut()}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="navbar-signin-btn"
                onClick={onOpenAuth}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => handleTabClick('events')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${
                role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {role}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => handleTabClick('events')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
              activeTab === 'events' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Upcoming Events
          </button>

          <button
            onClick={() => handleTabClick('my-registrations')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
              activeTab === 'my-registrations' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Ticket className="w-4 h-4" />
            My Registrations
          </button>

          {isAdmin && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="px-3 text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                Admin Area
              </div>
              <button
                onClick={() => handleTabClick('admin-dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                  activeTab === 'admin-dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
              </button>
              <button
                onClick={() => handleTabClick('admin-events')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                  activeTab === 'admin-events' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CalendarCog className="w-4 h-4" />
                Event Management
              </button>
              <button
                onClick={() => handleTabClick('admin-attendees')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                  activeTab === 'admin-attendees' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" />
                Attendee List
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setSimulatedRole('attendee')}
                className={`text-xs px-2 py-1 rounded border ${
                  role === 'attendee' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'text-slate-600'
                }`}
              >
                Attendee
              </button>
              <button
                onClick={() => setSimulatedRole('admin')}
                className={`text-xs px-2 py-1 rounded border ${
                  role === 'admin' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'text-slate-600'
                }`}
              >
                Admin
              </button>
            </div>

            {user ? (
              <button
                onClick={() => signOut()}
                className="text-xs text-rose-600 font-semibold flex items-center gap-1 p-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
