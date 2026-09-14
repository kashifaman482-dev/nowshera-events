import React, { useState } from 'react';
import { RegistrationItem, EventItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  X,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  LogIn,
} from 'lucide-react';

interface MyRegistrationsProps {
  registrations: RegistrationItem[];
  isLoading: boolean;
  onCancelRegistration: (registrationId: string) => Promise<void>;
  cancellingRegId: string | null;
  onBrowseEvents: () => void;
  onOpenAuth: () => void;
  onSelectEvent: (event: EventItem) => void;
}

export const MyRegistrations: React.FC<MyRegistrationsProps> = ({
  registrations,
  isLoading,
  onCancelRegistration,
  cancellingRegId,
  onBrowseEvents,
  onOpenAuth,
  onSelectEvent,
}) => {
  const { user } = useAuth();
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // Filter active registrations vs cancelled
  const activeRegistrations = registrations.filter((r) => r.status !== 'cancelled');

  if (!user) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-xs text-center">
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
          <Ticket className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Sign In to View Registrations</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Please log into your Nowshera Events attendee account to review your active event bookings
          and reservations.
        </p>
        <button
          id="my-registrations-signin-btn"
          onClick={onOpenAuth}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Registrations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {activeRegistrations.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your confirmed event reservations for {user.email}
          </p>
        </div>

        <button
          id="browse-more-events-btn"
          onClick={onBrowseEvents}
          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          Explore More Events
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading your registrations...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && activeRegistrations.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Active Registrations</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            You have not registered for any upcoming events yet. Check out the schedule of
            upcoming conferences and workshops happening in Nowshera.
          </p>
          <button
            onClick={onBrowseEvents}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Browse Upcoming Events
          </button>
        </div>
      )}

      {/* Registrations List */}
      {!isLoading && activeRegistrations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeRegistrations.map((reg) => {
            const ev = reg.event || reg.events;
            const isCancellingThis = cancellingRegId === reg.id;
            const isConfirming = confirmCancelId === reg.id;

            return (
              <div
                key={reg.id}
                id={`registration-item-${reg.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Confirmed Registration
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {reg.id.slice(0, 8)}...
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {ev?.title || 'Registered Event'}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>
                        {ev?.event_date
                          ? new Date(ev.event_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Date to be confirmed'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{ev?.event_time || 'Schedule to be confirmed'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate">{ev?.location || 'Nowshera Venue'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer and cancel action */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  {ev && (
                    <button
                      onClick={() => onSelectEvent(ev)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                    >
                      Event Details
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}

                  <div>
                    {isConfirming ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-rose-600 font-medium">Are you sure?</span>
                        <button
                          id={`cancel-confirm-yes-${reg.id}`}
                          disabled={isCancellingThis}
                          onClick={() => {
                            setConfirmCancelId(null);
                            onCancelRegistration(reg.id);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1"
                        >
                          {isCancellingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Yes, Cancel'
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmCancelId(null)}
                          className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`cancel-reg-btn-${reg.id}`}
                        disabled={isCancellingThis}
                        onClick={() => setConfirmCancelId(reg.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 rounded-xl transition-colors inline-flex items-center gap-1"
                      >
                        {isCancellingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        Cancel Registration
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
