import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, RefreshCw, UserCheck, ArrowRight } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  onOpenAuth: () => void;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, onOpenAuth }) => {
  const { user, role, isAdmin, isLoading, setSimulatedRole, refreshProfile, profileError } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8 text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">Verifying admin permissions...</p>
      </div>
    );
  }

  // Not signed in
  if (!user && role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
          <LogIn className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Admin Sign-In Required</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          The requested administrative module is protected. Please sign in with an account having
          the <span className="font-semibold text-indigo-700">Admin</span> role.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            id="admin-guard-signin-btn"
            onClick={onOpenAuth}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign In as Admin
          </button>
          <button
            id="admin-guard-demo-btn"
            onClick={() => setSimulatedRole('admin')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Switch to Admin Demo
          </button>
        </div>
      </div>
    );
  }

  // Signed in, but role in profiles table is 'attendee' (not admin)
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 bg-white border border-amber-200 rounded-2xl shadow-sm text-center">
        <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Admin Privileges Required</h2>
        <p className="text-sm text-slate-600 mb-2 leading-relaxed">
          You are currently signed in as <span className="font-semibold text-slate-800">{user?.email}</span> with
          the role <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded-md uppercase">Attendee</span>.
        </p>
        <p className="text-xs text-slate-500 mb-6">
          Admin pages (Event Management, Attendee Lists, and Dashboard) are strictly route-guarded
          to profiles with the <code className="text-indigo-600 font-mono">admin</code> role.
        </p>

        {profileError && (
          <div className="p-3.5 mb-6 bg-amber-50 rounded-xl text-xs text-amber-800 text-left border border-amber-200">
            <span className="font-bold block text-amber-900 mb-1">Database Profile Notice:</span>
            <p className="font-mono text-[11px] mb-2 text-amber-950 bg-amber-100/70 p-2 rounded border border-amber-200 break-all">
              {profileError}
            </p>
            {profileError.includes('infinite recursion') && (
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Fix:</strong> In your Supabase SQL Editor, run:
                <code className="block my-1.5 p-2 bg-white rounded border border-amber-300 font-mono text-[11px] text-slate-900 overflow-x-auto select-all">
                  DROP POLICY IF EXISTS &quot;Users can view profiles&quot; ON profiles;
                  <br />
                  CREATE POLICY &quot;Users can view own profile&quot; ON profiles FOR SELECT USING (auth.uid() = id);
                </code>
                In the meantime, you can use the button below to test Admin features.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            id="admin-guard-recheck-btn"
            onClick={() => refreshProfile()}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-check Profile
          </button>
          <button
            id="admin-guard-switch-role-btn"
            onClick={() => setSimulatedRole('admin')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
          >
            Switch Role to Admin
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Access granted
  return <>{children}</>;
};
