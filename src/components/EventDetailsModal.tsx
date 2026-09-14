import React from 'react';
import { EventItem, RegistrationItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Ticket,
  Shield,
} from 'lucide-react';

interface EventDetailsModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  userRegistration?: RegistrationItem | null;
  onRegister: (eventId: string) => Promise<void>;
  onCancel: (registrationId: string) => Promise<void>;
  isLoadingAction: boolean;
  onOpenAuth: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  userRegistration,
  onRegister,
  onCancel,
  isLoadingAction,
  onOpenAuth,
}) => {
  const { user } = useAuth();

  if (!isOpen || !event) return null;

  const isRegistered = Boolean(userRegistration && userRegistration.status !== 'cancelled');
  const remaining = event.remaining_capacity !== undefined ? event.remaining_capacity : Math.max(0, event.capacity - (event.registered_count || 0));
  const isSoldOut = remaining <= 0;
  const fillPercentage = event.capacity > 0 ? Math.min(100, Math.round(((event.registered_count || 0) / event.capacity) * 100)) : 0;

  return (
    <div
      id="event-details-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="event-details-dialog"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Title and close button */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="pr-6">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                  event.status === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : event.status === 'completed'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {event.status}
              </span>
              {isRegistered && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                  You are registered
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {event.title}
            </h2>
          </div>
          <button
            id="event-details-close-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key metadata chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Event Date
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }) : 'TBA'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Event Time
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {event.event_time || 'Schedule will be announced'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Venue Location
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {event.location || 'Nowshera, Khyber Pakhtunkhwa'}
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              About This Event
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-slate-100">
              {event.description || 'No detailed description provided for this event.'}
            </p>
          </div>

          {/* Availability & Capacity Tracker */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Users className="w-4 h-4 text-indigo-600" />
                Capacity & Registrations
              </span>
              <span className={remaining > 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                {remaining > 0 ? `${remaining} spots remaining` : 'Full capacity reached'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isSoldOut
                    ? 'bg-rose-500'
                    : fillPercentage > 85
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>

            <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
              <span>{event.registered_count || 0} attendees registered</span>
              <span>Total capacity: {event.capacity} seats</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {!user && 'Sign in required to register or manage reservations.'}
            {user && isRegistered && (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" />
                Active Registration Confirmed
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="event-details-cancel-modal-btn"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors w-full sm:w-auto text-center"
            >
              Close
            </button>

            {!user ? (
              <button
                id="event-details-auth-btn"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                Sign In to Register
              </button>
            ) : isRegistered && userRegistration ? (
              <button
                id="event-details-cancel-reg-btn"
                disabled={isLoadingAction}
                onClick={() => onCancel(userRegistration.id)}
                className="px-5 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors w-full sm:w-auto flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isLoadingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                ) : (
                  <X className="w-4 h-4 text-rose-600" />
                )}
                Cancel My Registration
              </button>
            ) : (
              <button
                id="event-details-register-btn"
                disabled={isLoadingAction || isSoldOut}
                onClick={() => onRegister(event.id)}
                className={`px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-sm transition-colors w-full sm:w-auto flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                  isSoldOut
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                }`}
              >
                {isLoadingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Ticket className="w-4 h-4" />
                )}
                {isSoldOut ? 'Event Sold Out' : 'Register for Event'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
