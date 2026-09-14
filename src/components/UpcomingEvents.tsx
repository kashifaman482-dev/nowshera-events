import React, { useState, useMemo } from 'react';
import { EventItem, RegistrationItem } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  Ticket,
  Loader2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface UpcomingEventsProps {
  events: EventItem[];
  userRegistrations: RegistrationItem[];
  isLoading: boolean;
  errorMessage?: string | null;
  onRegister: (eventId: string) => Promise<void>;
  onSelectEvent: (event: EventItem) => void;
  onOpenAuth: () => void;
  registeringEventId: string | null;
  onRefresh: () => void;
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events,
  userRegistrations,
  isLoading,
  errorMessage,
  onRegister,
  onSelectEvent,
  onOpenAuth,
  registeringEventId,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'soldout'>('all');

  // Map user registered event IDs for rapid lookup
  const registeredEventIds = useMemo(() => {
    return new Set(
      userRegistrations
        .filter((r) => r.status !== 'cancelled')
        .map((r) => String(r.event_id))
    );
  }, [userRegistrations]);

  // Filter published future events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Must be published
      if (event.status !== 'published') return false;

      // Search match
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        event.title.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Availability filter
      const remaining =
        event.remaining_capacity !== undefined
          ? event.remaining_capacity
          : Math.max(0, event.capacity - (event.registered_count || 0));

      if (availabilityFilter === 'available') return remaining > 0;
      if (availabilityFilter === 'soldout') return remaining <= 0;

      return true;
    });
  }, [events, searchQuery, availabilityFilter]);

  return (
    <div className="space-y-6">
      {/* Banner / Title Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            Discover & Participate
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Upcoming Events in Nowshera
          </h1>
          <p className="mt-2 text-sm text-indigo-100/80 leading-relaxed">
            Reserve your seat for upcoming community conferences, technical workshops, cultural
            gatherings, and educational seminars across District Nowshera.
          </p>
        </div>

        {/* Decorative ambient blur */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Supabase Error Banner */}
      {errorMessage && (
        <div
          id="events-fetch-error-banner"
          className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 text-rose-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-rose-900">Supabase Connection or Query Error</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">
                  Database Error
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-1 font-mono break-all leading-relaxed bg-rose-100/50 p-2 rounded-lg border border-rose-200/60">
                {errorMessage}
              </p>
              <p className="text-[11px] text-rose-600 mt-1">
                The database request to Supabase failed. Please inspect permissions, table schema, or network access.
              </p>
            </div>
          </div>
          <button
            id="retry-events-fetch-btn"
            onClick={onRefresh}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Query
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="events-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, location, or keyword..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Availability Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl shrink-0">
          <button
            id="filter-all"
            onClick={() => setAvailabilityFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              availabilityFilter === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Events
          </button>
          <button
            id="filter-available"
            onClick={() => setAvailabilityFilter('available')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              availabilityFilter === 'available'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Available Spots
          </button>
          <button
            id="filter-soldout"
            onClick={() => setAvailabilityFilter('soldout')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              availabilityFilter === 'soldout'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading published events...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving latest schedules from Nowshera database</p>
        </div>
      )}

      {/* Empty State / Error State */}
      {!isLoading && filteredEvents.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div
            className={`w-14 h-14 ${
              errorMessage ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'
            } rounded-2xl flex items-center justify-center mx-auto mb-4`}
          >
            {errorMessage ? <AlertCircle className="w-7 h-7" /> : <Calendar className="w-7 h-7" />}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {errorMessage ? 'Unable to Load Events' : 'No Events Found'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {errorMessage ? (
              <span className="text-rose-600 font-mono text-xs block bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                {errorMessage}
              </span>
            ) : searchQuery ? (
              `No upcoming events match your search term "${searchQuery}". Try clearing search filters.`
            ) : (
              'There are currently no published upcoming events listed in Nowshera.'
            )}
          </p>
          {errorMessage ? (
            <button
              onClick={onRefresh}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          ) : searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setAvailabilityFilter('all');
              }}
              className="px-4 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-xl"
            >
              Reset Filters
            </button>
          ) : null}
        </div>
      )}

      {/* Events Grid */}
      {!isLoading && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const isRegistered = registeredEventIds.has(String(event.id));
            const remaining =
              event.remaining_capacity !== undefined
                ? event.remaining_capacity
                : Math.max(0, event.capacity - (event.registered_count || 0));
            const isSoldOut = remaining <= 0;
            const isThisRegistering = registeringEventId === event.id;

            return (
              <div
                key={event.id}
                id={`event-card-${event.id}`}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
              >
                {/* Event Card Header */}
                <div className="p-5 pb-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {/* Remaining Spots Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isSoldOut
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : remaining <= 10
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      {isSoldOut ? 'Sold Out' : `${remaining} spots available`}
                    </span>

                    {/* Registration Status Check */}
                    {isRegistered && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" />
                        Registered
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                    {event.title}
                  </h3>

                  <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {event.description || 'Join this exciting community event in Nowshera.'}
                  </p>

                  {/* Metadata items */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-medium text-slate-800">
                        {event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }) : 'Date TBA'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{event.event_time || 'Schedule TBA'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate" title={event.location}>
                        {event.location || 'Nowshera'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  <button
                    id={`event-details-btn-${event.id}`}
                    onClick={() => onSelectEvent(event)}
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors text-center"
                  >
                    View Details
                  </button>

                  {!user ? (
                    <button
                      id={`event-auth-register-${event.id}`}
                      onClick={onOpenAuth}
                      className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Register
                    </button>
                  ) : isRegistered ? (
                    <button
                      id={`event-registered-${event.id}`}
                      onClick={() => onSelectEvent(event)}
                      className="flex-1 py-2 px-3 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      Registered
                    </button>
                  ) : (
                    <button
                      id={`event-register-btn-${event.id}`}
                      disabled={isSoldOut || isThisRegistering}
                      onClick={() => onRegister(event.id)}
                      className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                        isSoldOut
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isThisRegistering ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <Ticket className="w-3.5 h-3.5" />
                          {isSoldOut ? 'Sold Out' : 'Register'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
