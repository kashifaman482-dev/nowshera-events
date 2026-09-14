import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { X, Mail, Lock, User, ShieldCheck, LogIn, UserPlus, Loader2, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signin',
  onSuccess,
}) => {
  const { signIn, signUp, setSimulatedRole } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('attendee');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const result = await signIn(email, password);
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          setSuccessMessage('Signed in successfully!');
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 600);
        }
      } else {
        const result = await signUp(email, password, role, fullName);
        if (result.error) {
          setErrorMessage(result.error);
        } else {
          setSuccessMessage(result.message || 'Account created successfully!');
          if (result.message?.includes('signed in')) {
            setTimeout(() => {
              onSuccess?.();
              onClose();
            }, 800);
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoRole: UserRole) => {
    setSimulatedRole(demoRole);
    setSuccessMessage(`Switched to demo session as ${demoRole.toUpperCase()}`);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 500);
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'signin'
                ? 'Sign in to access your registrations & events'
                : 'Join Nowshera Events to explore & manage community events'}
            </p>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 m-6 mb-4 rounded-xl">
          <button
            id="tab-signin"
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <button
            id="tab-signup"
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Sign Up
          </button>
        </div>

        {/* Feedback message */}
        {errorMessage && (
          <div className="mx-6 mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="signup-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aman Kashif"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('attendee')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      role === 'attendee'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 ring-1 ring-indigo-600'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Attendee
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      role === 'admin'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 ring-1 ring-indigo-600'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : mode === 'signin' ? (
              'Sign In to Platform'
            ) : (
              `Create ${role === 'admin' ? 'Admin' : 'Attendee'} Account`
            )}
          </button>
        </form>

        {/* Quick Demo Mode Selector to simplify testing */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant Role Simulation (Evaluation Mode):</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="demo-role-attendee-btn"
              onClick={() => handleQuickDemo('attendee')}
              className="py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-all text-center text-xs"
            >
              Test as Attendee
            </button>
            <button
              type="button"
              id="demo-role-admin-btn"
              onClick={() => handleQuickDemo('admin')}
              className="py-1.5 px-2.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:border-indigo-300 text-indigo-700 font-medium hover:bg-indigo-100 transition-all text-center text-xs"
            >
              Test as Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
